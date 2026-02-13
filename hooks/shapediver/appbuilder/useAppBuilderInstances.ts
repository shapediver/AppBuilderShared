import {IUseSessionDto} from "@AppBuilderShared/hooks/shapediver/useSession";
import {useShapeDiverStoreInstances} from "@AppBuilderShared/store/useShapeDiverStoreInstances";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreProcessManager} from "@AppBuilderShared/store/useShapeDiverStoreProcessManager";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {
	IAppBuilder,
	IAppBuilderInstanceDefinition,
	IAppBuilderSettingsSession,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Mat4Array} from "@AppBuilderShared/types/shapediver/common";
import {IParameterStore} from "@AppBuilderShared/types/store/shapediverStoreParameters";
import {IProcessDefinition} from "@AppBuilderShared/types/store/shapediverStoreProcessManager";
import {ResOutput, ResOutputContent} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	assignMaterialFromDatabase,
	ISessionApi,
	ITreeNode,
	SessionData,
	SessionOutputData,
	TreeNode,
} from "@shapediver/viewer.session";
import {mat4} from "gl-matrix";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {
	ParameterValueDefinition,
	useResolveParameterValues,
} from "../parameters/useResolveParameterValues";

import {Logger} from "@AppBuilderShared/utils/logger";
import {useSessions} from "../useSessions";
import useResolveAppBuilderSessions from "./useResolveAppBuilderSessions";
interface Props {
	namespace: string;
	/**
	 * The session API of the controller session.
	 * This is used to add the instances.
	 */
	sessionApi: ISessionApi | undefined;
	/**
	 * The app builder data to parse.
	 */
	appBuilderData: IAppBuilder | undefined;
	/**
	 * The process ID to add the promises to.
	 */
	processManagerId: string | undefined;
}

type IParsedInstanceDefinition = {
	session: ISessionApi;
	parameterValues: {[key: string]: string};
	transformations?: number[][];
	originalIndex: number;
	name?: string;
	outputActions: IAppBuilderInstanceDefinition["outputActions"];
};

/**
 * Hook for creating app builder instances.
 * This hook parses the app builder data and creates instances in the viewer.
 * The instances are created with the correct parameter set and transformations.
 *
 * @param props
 */
export function useAppBuilderInstances(props: Props) {
	const {
		namespace,
		sessionApi,
		appBuilderData,
		processManagerId: sessionProcessManagerId,
	} = props;

	const {
		sessions,
		pendingSessions,
		addSessionUpdateCallback,
		createPendingSession,
	} = useShapeDiverStoreSession();
	const {
		addProcess,
		createProcessManager,
		removeProcessManager,
		processManagers,
	} = useShapeDiverStoreProcessManager();
	const {
		addCustomizationResult,
		removeCustomizationResult,
		customizationResults,
		addInstance,
		removeInstance,
	} = useShapeDiverStoreInstances();

	const {batchParameterValueUpdate, getParameter} =
		useShapeDiverStoreParameters(
			useShallow((state) => ({
				batchParameterValueUpdate: state.batchParameterValueUpdate,
				getParameter: state.getParameter,
			})),
		);

	const [instanceNodes, setInstanceNodes] = useState<{
		[key: string]: ITreeNode;
	}>({});

	const loadedRef = useRef(false);
	const customizationResultInStoreRef = useRef(customizationResults);
	const instanceNodesRef = useRef<{
		[key: string]: ITreeNode;
	}>({});
	const instancesRef = useRef<IAppBuilderInstanceDefinition[]>([]);
	const sessionsRef = useRef(sessions);
	const pendingSessionsRef = useRef(pendingSessions);
	const sessionNodeRef = useRef<ITreeNode | undefined>(undefined);
	const sessionProcessManagerIdRef = useRef(sessionProcessManagerId);
	const processManagersRef = useRef(processManagers);

	useEffect(() => {
		processManagersRef.current = processManagers;
	}, [processManagers]);

	useEffect(() => {
		sessionProcessManagerIdRef.current = sessionProcessManagerId;
	}, [sessionProcessManagerId]);

	useEffect(() => {
		customizationResultInStoreRef.current = customizationResults;
	}, [customizationResults]);

	useEffect(() => {
		sessionsRef.current = sessions;
	}, [sessions]);

	useEffect(() => {
		pendingSessionsRef.current = pendingSessions;
	}, [pendingSessions]);

	// store for the parsed app builder instances
	const [parsedAppBuilderInstances, setParsedAppBuilderInstances] = useState<
		IParsedInstanceDefinition[]
	>([]);
	const [parameterValuesData, setParameterValuesData] = useState<{
		parameterValues: ParameterValueDefinition[];
		information: {
			parameterValuesMap: {
				[key: string]: {
					[key: string]: number;
				};
			};
			instances?: IAppBuilderInstanceDefinition[];
		};
	}>();

	const {instances, embeddedSessions} = useMemo(() => {
		if (!appBuilderData) {
			setParsedAppBuilderInstances([]);
			return {
				instances: undefined,
				embeddedSessions: [],
			};
		}

		const sessionsDescriptions: {slug: string; id: string}[] = [];
		appBuilderData.instances?.forEach((instance) => {
			// check if the session is already added
			// either in the currently loaded sessions, or in the pending sessions
			if (
				!sessionsRef.current[instance.sessionId] &&
				!Object.values(pendingSessionsRef.current).find(
					(session) => session.dto.id === instance.sessionId,
				)
			) {
				// use slug if available, otherwise use sessionId
				const slug = instance.slug || instance.sessionId;

				const index = sessionsDescriptions.findIndex(
					(session) => session.slug === slug,
				);

				// there already is a session with this slug
				// check if the ids match, if not, warn the user
				if (index !== -1) {
					if (sessionsDescriptions[index].id !== instance.sessionId) {
						Logger.warn(
							`Multiple instances are using the same slug "${slug}" but different session ids ("${sessionsDescriptions[index].id}" and "${instance.sessionId}"). This can lead to unexpected behavior.`,
						);
					}
					return;
				}

				sessionsDescriptions.push({
					slug,
					id: instance.sessionId,
				});
			}
		});

		return {
			instances: appBuilderData.instances,
			embeddedSessions: sessionsDescriptions as (IUseSessionDto &
				IAppBuilderSettingsSession)[],
		};
	}, [appBuilderData]);

	// from the incoming slugs, retrieve the session data from the platform
	const {sessions: sessionData, error: platformError} =
		useResolveAppBuilderSessions(embeddedSessions);

	// add some necessary flags to the resolved sessions
	const resolvedSessions = useMemo(() => {
		if (!sessionData) return [];
		(
			sessionData as (IUseSessionDto & IAppBuilderSettingsSession)[]
		).forEach((s) => {
			s.loadOutputs = false;
			s.registerParametersAndExports = false;
			s.keepInStore = true;
		});
		return sessionData;
	}, [sessionData]);

	// create the sessions
	const {errors: sessionErrors} = useSessions(resolvedSessions ?? []);

	useEffect(() => {
		if (platformError)
			Logger.warn("Error resolving sessions:", platformError);

		for (const sessionError of sessionErrors)
			Logger.warn("Error creating sessions:", sessionError);
	}, [platformError, sessionErrors]);

	const createParsedInstances = useCallback(
		(instances: IAppBuilderInstanceDefinition[]) => {
			const parsedInstances: IParsedInstanceDefinition[] = [];

			instances.forEach((instance, index) => {
				const session = sessionsRef.current[instance.sessionId];
				if (!session) return;

				const parameterValuesWithIds: {[key: string]: string} = {};

				Object.entries(instance.parameterValues ?? {}).map(
					([key, value]) => {
						const parameter = Object.values(
							session.parameters,
						).find(
							(p) =>
								p.displayname === key ||
								p.id === key ||
								p.name === key,
						);
						if (parameter) {
							parameterValuesWithIds[parameter.id] = value + "";
						} else {
							Logger.warn(
								`Could not find parameter for key ${key} in session ${session.id}.`,
							);
						}
					},
				);

				parsedInstances.push({
					session,
					parameterValues: parameterValuesWithIds,
					transformations: instance.transformations,
					originalIndex: index,
					name: instance.name,
					outputActions: instance.outputActions,
				});
			});
			setParsedAppBuilderInstances(parsedInstances);
		},
		[],
	);

	// Use useResolvedParameters to resolve the parameter values
	const resolvedParameterValuesArray = useResolveParameterValues({
		namespace,
		parameterValues: parameterValuesData?.parameterValues,
	});

	// once the pending sources are loaded, we can create the instances
	useEffect(() => {
		if (!parameterValuesData || !resolvedParameterValuesArray) return;
		const {parameterValuesMap, instances} = parameterValuesData.information;
		if (!instances) return;

		const instancesCopy = JSON.parse(
			JSON.stringify(instances),
		) as IAppBuilderInstanceDefinition[];
		Object.entries(parameterValuesMap ?? {}).forEach(
			([instanceIndex, instanceSourceMap]) => {
				Object.entries(instanceSourceMap).forEach(([key, value]) => {
					if (
						parameterValuesMap[instanceIndex] !== undefined &&
						parameterValuesMap[instanceIndex][key] !== undefined
					) {
						const resolvedValue =
							resolvedParameterValuesArray[value];

						const instance = instancesCopy[parseInt(instanceIndex)];

						if (!instance.parameterValues)
							instance.parameterValues = {};

						if (resolvedValue !== undefined) {
							instance.parameterValues[key] = resolvedValue + "";
						} else {
							instance.parameterValues[key] = "";
							Logger.warn(
								`Could not resolve parameter value source for parameter ${key} in instance ${instance.name}. Setting value to empty string.`,
							);
						}
					}
				});
			},
		);

		createParsedInstances(instancesCopy);
		setParameterValuesData(undefined);
	}, [resolvedParameterValuesArray, parameterValuesData]);

	useEffect(() => {
		if (!instances) return;

		instances.forEach((instance) => {
			const session = sessionsRef.current[instance.sessionId];

			if (!session)
				// check if there are sessions that were not created yet
				createPendingSession(instance.sessionId);
		});
	}, [instances]);

	/**
	 * Parse the app builder data.
	 * Gather all the necessary information to create the instances.
	 */
	useEffect(() => {
		if (!instances) return;

		// don't do anything if one of the sessions is not available yet
		const missingSession = instances.some(
			(instance) => !sessions[instance.sessionId],
		);
		if (missingSession) return;

		// check if the instances have changed
		if (
			JSON.stringify(instances) === JSON.stringify(instancesRef.current)
		) {
			const processManagerId =
				sessionProcessManagerIdRef.current &&
				processManagersRef.current[sessionProcessManagerIdRef.current]
					? sessionProcessManagerIdRef.current
					: undefined;
			if (processManagerId && loadedRef.current) {
				removeProcessManager(processManagerId);
				sessionProcessManagerIdRef.current = undefined;
			}
			return;
		}

		// set the instances ref to the current instances
		instancesRef.current = JSON.parse(JSON.stringify(instances));
		loadedRef.current = false;

		const existingNames = new Set<string>();
		const parameterValuesMap: {
			[key: string]: {[key: string]: number};
		} = {};
		const parameterValuesToLoad: ParameterValueDefinition[] = [];

		instances.forEach((instance, index) => {
			if (instance.name) {
				if (existingNames.has(instance.name)) {
					Logger.warn(
						`Duplicate instance name found: ${instance.name}. Instance names must be unique, skipping instance.`,
					);
					return;
				} else {
					existingNames.add(instance.name);
				}
			}

			Object.entries(instance.parameterValues ?? {}).forEach(
				([key, value]) => {
					const parameterIndex =
						parameterValuesToLoad.push({
							id: key,
							value: value,
							namespace: instance.sessionId,
						}) - 1;

					if (!parameterValuesMap[index])
						parameterValuesMap[index] = {};

					parameterValuesMap[index][key] = parameterIndex;
				},
			);
		});

		setParameterValuesData({
			parameterValues: parameterValuesToLoad,
			information: {
				parameterValuesMap,
				instances,
			},
		});
	}, [instances, sessions]);

	const sessionUpdateCallback = useCallback((newNode?: ITreeNode) => {
		sessionNodeRef.current = newNode;
		if (!newNode) return;

		Object.values(instanceNodesRef.current).forEach((instance) => {
			if (newNode.hasChild(instance)) return;

			// add the instance to the controller session node
			newNode.addChild(instance);
			// update the version of the node
			// this won't be triggered as long as a process is running
			newNode.updateVersion();
		});
	}, []);

	useEffect(() => {
		for (const instanceId in instanceNodes) {
			addInstance(instanceId, instanceNodes[instanceId]);
		}

		instanceNodesRef.current = instanceNodes;

		return () => {
			for (const instanceId in instanceNodes) {
				removeInstance(instanceId);
			}
		};
	}, [instanceNodes]);

	useEffect(() => {
		const removeSessionUpdateCallback = addSessionUpdateCallback(
			sessionApi?.id ?? "",
			sessionUpdateCallback,
		);

		return () => {
			removeSessionUpdateCallback();
		};
	}, [sessionApi, sessionUpdateCallback]);

	useEffect(() => {
		if (!sessionApi) return;

		// create a promise to wait for all instances to be created
		// this is necessary to only resolve the process once all instances are created
		// and added to the controller session node
		let resolveMainPromise: () => void;
		const mainPromise = new Promise<void>((resolve) => {
			resolveMainPromise = resolve;
		});

		const mainProcessDefinition: IProcessDefinition = {
			name: "Instance Process",
			promise: mainPromise,
		};

		// we check if a process manager id is given
		// and if it is still valid
		const processManagerId =
			sessionProcessManagerIdRef.current &&
			processManagersRef.current[sessionProcessManagerIdRef.current]
				? sessionProcessManagerIdRef.current
				: createProcessManager(sessionApi.id);
		addProcess(processManagerId, mainProcessDefinition);

		const newInstances: {
			[key: string]: {
				node: ITreeNode;
				definition: IParsedInstanceDefinition;
			};
		} = {};
		const customizationResultPromise: {
			[key: string]: Promise<ITreeNode>;
		} = {};
		const promises: Promise<void>[] = [];

		parsedAppBuilderInstances.forEach((instance) => {
			const promise = createInstance(
				instance,
				customizationResultPromise,
				newInstances,
				processManagerId,
				customizationResultInStoreRef.current,
				addCustomizationResult,
				addProcess,
			);
			promises.push(promise);
		});

		// wait for all instance promises to resolve
		// then look for output actions to be executed
		Promise.all(promises).then(() => {
			const outputCallbackPromises = processOutputActions(
				sessionApi,
				newInstances,
				namespace,
				batchParameterValueUpdate,
				getParameter,
			);

			loadedRef.current = true;

			// wait for all output callbacks to resolve
			// before we add the instances to the session node
			Promise.all(outputCallbackPromises).then(() => {
				addInstanceToSceneTree(
					newInstances,
					instanceNodesRef.current,
					sessionNodeRef.current,
				);

				setInstanceNodes(
					Object.entries(newInstances).reduce(
						(acc, [key, cur]) => {
							acc[key] = cur.node;
							return acc;
						},
						{} as {[key: string]: ITreeNode},
					),
				);

				// resolve the main promise
				// to signal that the process is finished
				if (outputCallbackPromises.length === 0) resolveMainPromise!();

				// clean up the session instances
				// only instances that are currently in the scene are kept
				// the others are removed from the store
				Object.keys(customizationResultInStoreRef.current).forEach(
					(instanceId) => {
						if (
							customizationResultPromise[instanceId] !== undefined
						)
							return;
						removeCustomizationResult(instanceId);
					},
				);
			});
		});

		return () => {
			if (sessionNodeRef.current) {
				Object.values(instanceNodesRef.current).forEach((instance) => {
					if (sessionNodeRef.current!.hasChild(instance)) {
						sessionNodeRef.current!.removeChild(instance);
					}
				});
			}
			setInstanceNodes({});
		};
	}, [parsedAppBuilderInstances, namespace]);
}

/**
 * Adds the new instances to the scene tree.
 * The last step before the process is finished.
 * Removes the old instances from the scene tree.
 *
 * @param newInstances
 * @param instances
 * @param sessionNode
 */
const addInstanceToSceneTree = (
	newInstances: {
		[key: string]: {
			node: ITreeNode;
			definition: IParsedInstanceDefinition;
		};
	},
	instances: {[key: string]: ITreeNode},
	sessionNode?: ITreeNode,
) => {
	// we add the instances to the controller session node
	// and remove the old instances from the session node
	// this is necessary to happen before the process is finished
	if (sessionNode) {
		// remove the old instances from the session node
		Object.values(instances).forEach((instance) => {
			if (sessionNode!.hasChild(instance)) {
				sessionNode!.removeChild(instance);
			}
		});

		Object.values(newInstances).forEach((instance) => {
			if (sessionNode!.hasChild(instance.node)) return;

			// add the instance to the controller session node
			sessionNode!.addChild(instance.node);
			// update the version of the node
			// this won't be triggered as long as a process is running
			sessionNode!.updateVersion();
		});
	}
};

/**
 * Creates an instance in the viewer.
 * The instance is created with the correct parameter set and transformations.
 * The instance creation is added to the process manager.
 *
 * @param instance
 * @param customizationResultPromise
 * @param newInstances
 * @param processManagerId
 * @param customizationResultInStore
 * @param addCustomizationResult
 * @param addProcess
 * @returns A promise that resolves once the instance is created and added to the newInstances object.
 */
const createInstance = (
	instance: IParsedInstanceDefinition,
	customizationResultPromise: {[key: string]: Promise<ITreeNode>},
	newInstances: {
		[key: string]: {
			node: ITreeNode;
			definition: IParsedInstanceDefinition;
		};
	},
	processManagerId: string,
	customizationResultInStore: {[key: string]: ITreeNode},
	addCustomizationResult: (instanceId: string, instance: ITreeNode) => void,
	addProcess: (processManagerId: string, process: IProcessDefinition) => void,
) => {
	// create a callback function for the progress
	let progressCallback: (progress: {
		percentage: number;
		msg?: string;
	}) => void;

	// create a function to register the progress callback
	const onProgressCallback = (
		callback: (progress: {percentage: number; msg?: string}) => void,
	) => {
		progressCallback = callback;
	};

	// convert the parameter values to a JSON string
	const parameterValuesJson = JSON.stringify(instance.parameterValues);

	// the instance customization id is a combination of the session id and the parameter values
	const instanceCustomizationId =
		instance.session.id + "_" + parameterValuesJson;

	// the instance name is the name of the instance (if it exists, otherwise the original index)
	const instanceName =
		instance.name ?? `instances[${instance.originalIndex}]`;

	// first we need to check if the session instance already exists
	// there are two cases:
	// 1. the instance has already been created in the last parameter update and is still in the store
	// 2. the instance has already been requested by another process and is currently awaited
	let creationPromise: Promise<ITreeNode>;
	if (customizationResultInStore[instanceCustomizationId]) {
		creationPromise = Promise.resolve(
			customizationResultInStore[instanceCustomizationId],
		);
		customizationResultPromise[instanceCustomizationId] = creationPromise;
	} else if (
		customizationResultPromise[instanceCustomizationId] !== undefined
	) {
		creationPromise = customizationResultPromise[instanceCustomizationId];
	} else {
		creationPromise = instance.session
			.customizeParallel(instance.parameterValues)
			.then((node) => {
				addCustomizationResult(instanceCustomizationId, node);
				return node;
			});
		customizationResultPromise[instanceCustomizationId] = creationPromise;
	}

	/**
	 * After the creation progress is finished, we need to add the transformations
	 * to the instance node.
	 * The transformations are added to the instance node as children.
	 * The instance node is then added to the controller session node.
	 */
	const promise = creationPromise.then(async (node) => {
		// send a progress update
		progressCallback({
			percentage: 0.45,
			msg: "Applying transformations to instance...",
		});
		const instanceNode = new TreeNode(instanceName);
		instanceNode.originalName = instanceName;

		// if no transformations are defined, we use the identity matrix
		const transformations = instance.transformations ?? [
			[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
		];

		// add the session data to the instance node
		const sessionData = node.data.find((d) => d instanceof SessionData);
		if (sessionData && !instanceNode.hasData(sessionData))
			instanceNode.addData(sessionData);

		// once the node is created, add the transformations
		transformations.forEach((transformation, index) => {
			const transformationId = `transformations[${index}]`;
			const transformationNode = new TreeNode(transformationId);
			transformationNode.originalName = transformationId;

			// convert the transformation to a mat4
			const transformationMatrix = mat4.fromValues(
				...(transformation as unknown as Mat4Array),
			);

			transformationNode.addTransformation({
				id: transformationId,
				matrix: transformationMatrix,
			});

			for (let i = 0; i < node.children.length; i++) {
				const child = node.children[i];
				transformationNode.addChild(child.clone());
			}

			instanceNode.addChild(transformationNode);
		});

		// if there is a material database, we need to apply it
		if (assignMaterialFromDatabase)
			await assignMaterialFromDatabase(instanceNode);

		// send a progress update
		progressCallback({
			percentage: 0.9,
			msg: "Adding instance to scene... ",
		});

		newInstances[instanceName] = {
			node: instanceNode,
			definition: instance,
		};
	});

	// add the promise to the process manager
	// once all registered promises are resolved, the viewports are updated
	// and the process manager is removed from the store
	const processDefinition: IProcessDefinition = {
		name: instanceName,
		promise: promise,
		onProgress: onProgressCallback,
	};
	addProcess(processManagerId, processDefinition);

	// call the first progress update
	progressCallback!({
		percentage: 0.1,
		msg: "Creating instance...",
	});

	return promise;
};

/**
 * Processes the output actions defined in the instance definition.
 * Currently, only the "setParameterValue" action is supported.
 *
 * @param sessionApi The session API of the controller session.
 * @param newInstances The newly created instances.
 * @param namespace The namespace of the app builder data.
 * @param batchParameterValueUpdate The function to batch update parameter values.
 * @returns An array of promises that resolve once the output actions are executed.
 */
const processOutputActions = (
	sessionApi: ISessionApi,
	newInstances: {
		[key: string]: {
			node: ITreeNode;
			definition: IParsedInstanceDefinition;
		};
	},
	namespace: string,
	batchParameterValueUpdate: (
		params: Record<string, any>,
		skipHistory?: boolean,
		skipUrlUpdate?: boolean,
	) => Promise<void>,
	getParameter: (
		namespace: string,
		key: string,
	) => IParameterStore | undefined,
) => {
	let outputCallbackPromises: Promise<void>[] = [];

	// we gather all outputs to be set in one object
	// to only call the batch update once
	// this is necessary as multiple instances might want to set the same parameter
	const outputReturns: {
		// the parameter id
		[key: string]: {
			// first level, "instances[INDEX]" or name of the instance (if a name was provided)
			[key: string]: {
				// second level, the output displayname/name/id (same as specified in the outputActions)
				[key: string]: ResOutputContent[] | undefined;
			};
		};
	} = {};

	// if there are output actions defined, we need to execute them now
	Object.values(newInstances).forEach((instance) => {
		if (
			!instance.definition.outputActions ||
			instance.definition.outputActions.length === 0
		)
			return;

		// we currently only support setting parameter values
		// in the future, more actions can be added here
		instance.definition.outputActions.forEach((action) => {
			if (action.type === "setParameterValue") {
				// can be displayname, name or id
				const parameterIdentifier = action.props.parameter;

				const parameterId =
					sessionApi.getParameterByName(parameterIdentifier)[0]?.id ||
					sessionApi.getParameterById(parameterIdentifier)?.id;

				if (!parameterId) return;

				// can be displayname, name or id
				const outputIdentifier = action.props.output;

				// we only need the first child for this instance as the result
				// will be the same for all transformations
				const firstInstanceChild = instance.node?.children[0];
				if (!firstInstanceChild) return;

				let outputData: ResOutput | undefined;
				// we traverse the children which represent the computed outputs
				for (const child of firstInstanceChild.children) {
					const responseOutput = child.data.find(
						(d) => d instanceof SessionOutputData,
					)?.responseOutput;
					if (!responseOutput) return;
					if (
						responseOutput.displayname === outputIdentifier ||
						responseOutput.name === outputIdentifier ||
						responseOutput.id === outputIdentifier
					) {
						outputData = responseOutput;
						break;
					}
				}

				if (outputData) {
					if (outputReturns[parameterId] !== undefined) {
						if (
							outputReturns[parameterId][
								instance.definition.name ??
									`instances[${instance.definition.originalIndex}]`
							] !== undefined
						) {
							outputReturns[parameterId][
								instance.definition.name ??
									`instances[${instance.definition.originalIndex}]`
							][outputIdentifier] = outputData.content;
						} else {
							outputReturns[parameterId][
								instance.definition.name ??
									`instances[${instance.definition.originalIndex}]`
							] = {
								[outputIdentifier]: outputData.content,
							};
						}
					} else {
						outputReturns[parameterId] = {
							[instance.definition.name ??
							`instances[${instance.definition.originalIndex}]`]:
								{
									[outputIdentifier]: outputData.content,
								},
						};
					}
				}
			}
		});
	});

	// now we check if there are any outputs to be set
	if (Object.keys(outputReturns).length > 0) {
		const param = Object.entries(outputReturns).reduce(
			(acc, [key, value]) => {
				const parameter = getParameter(namespace, key);
				if (!parameter) return acc;

				const v = JSON.stringify(value);
				// check if the parameter already has the correct value
				if (parameter.getState().actions.isUiValueDifferent(v))
					acc[key] = v;

				return acc;
			},
			{} as Record<string, any>,
		);

		// if there are no parameters to set, we skip the update call
		// this can happen if the output action wants to set a value
		// that is already set in the parameter
		if (Object.keys(param).length === 0) return outputCallbackPromises;

		outputCallbackPromises.push(
			batchParameterValueUpdate(
				{
					[namespace]: param,
				},
				true,
				true,
			),
		);
	}

	return outputCallbackPromises;
};
