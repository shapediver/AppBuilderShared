import {useShapeDiverStoreInstances} from "@AppBuilderShared/store/useShapeDiverStoreInstances";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreProcessManager} from "@AppBuilderShared/store/useShapeDiverStoreProcessManager";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {
	IAppBuilder,
	IAppBuilderInstanceDefinition,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Mat4Array} from "@AppBuilderShared/types/shapediver/common";
import {IProcessDefinition} from "@AppBuilderShared/types/store/shapediverStoreProcessManager";
import {ResOutput, ResOutputContent} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	ISessionApi,
	ITreeNode,
	SessionOutputData,
	TreeNode,
} from "@shapediver/viewer.session";
import {mat4} from "gl-matrix";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useShallow} from "zustand/react/shallow";

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

	const {sessions, addSessionUpdateCallback} = useShapeDiverStoreSession();
	const {addProcess, createProcessManager, processManagers} =
		useShapeDiverStoreProcessManager();
	const {
		addCustomizationResult,
		removeCustomizationResult,
		customizationResults,
		addInstance,
		removeInstance,
	} = useShapeDiverStoreInstances();

	const {batchParameterValueUpdate} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			batchParameterValueUpdate: state.batchParameterValueUpdate,
		})),
	);

	const [instances, setInstances] = useState<{
		[key: string]: ITreeNode;
	}>({});

	const customizationResultInStoreRef = useRef(customizationResults);
	const instancesRef = useRef<{
		[key: string]: ITreeNode;
	}>({});
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
		customizationResultInStoreRef.current = customizationResults;
	}, [customizationResults]);

	/**
	 * Parse the app builder data.
	 * Gather all the necessary information to create the instances.
	 */
	const appBuilderInstances = useMemo(() => {
		if (!appBuilderData) return [];
		const instances = appBuilderData.instances ?? [];

		const parsedInstances: IParsedInstanceDefinition[] = [];

		instances.forEach((instance, index) => {
			const session = sessions[instance.sessionId];
			if (!session) return;

			const parameterValuesWithIds: {[key: string]: string} = {};

			Object.entries(instance.parameterValues ?? {}).map(
				([key, value]) => {
					// first, check the display name
					Object.values(session.parameters).forEach((parameter) => {
						if (parameter.displayname !== key) return;
						parameterValuesWithIds[parameter.id] = value + "";
					});
					// if the display name is not found, check the name
					if (parameterValuesWithIds[key]) return;
					const parameterByName = session.getParameterByName(key);
					if (parameterByName.length > 0) {
						parameterValuesWithIds[parameterByName[0].id] =
							value + "";
						return;
					}

					// if the parameter is not found, we search by id
					const parameterById = session.getParameterById(key);
					if (parameterById) parameterValuesWithIds[key] = value + "";
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

		return parsedInstances;
	}, [appBuilderData, sessions]);

	const sessionUpdateCallback = useCallback((newNode?: ITreeNode) => {
		sessionNodeRef.current = newNode;
		if (!newNode) return;

		Object.values(instancesRef.current).forEach((instance) => {
			if (newNode.hasChild(instance)) return;

			// add the instance to the controller session node
			newNode.addChild(instance);
			// update the version of the node
			// this won't be triggered as long as a process is running
			newNode.updateVersion();
		});
	}, []);

	useEffect(() => {
		for (const instanceId in instances) {
			addInstance(instanceId, instances[instanceId]);
		}

		instancesRef.current = instances;

		return () => {
			for (const instanceId in instances) {
				removeInstance(instanceId);
			}
		};
	}, [instances]);

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

		appBuilderInstances.forEach((instance) => {
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
			);

			// wait for all output callbacks to resolve
			// before we add the instances to the session node
			Promise.all(outputCallbackPromises).then(() => {
				addInstanceToSceneTree(
					newInstances,
					instancesRef.current,
					sessionNodeRef.current,
				);

				setInstances(
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
				resolveMainPromise!();

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
				Object.values(instancesRef.current).forEach((instance) => {
					if (sessionNodeRef.current!.hasChild(instance)) {
						sessionNodeRef.current!.removeChild(instance);
					}
				});
			}
			setInstances({});
		};
	}, [appBuilderInstances, namespace]);
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
	 * We need to transpose the matrix because of different column/row major order.
	 * The transformations are added to the instance node as children.
	 * The instance node is then added to the controller session node.
	 */
	const promise = creationPromise.then((node) => {
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

		// once the node is created, add the transformations
		transformations.forEach((transformation, index) => {
			const transformationId = `transformations[${index}]`;
			const transformationNode = new TreeNode(transformationId);
			transformationNode.originalName = transformationId;

			// we have to transpose the matrix
			// because of different column/row major order
			const transformationMatrix = mat4.transpose(
				mat4.create(),
				mat4.fromValues(...(transformation as unknown as Mat4Array)),
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
	batchParameterValueUpdate: (params: Record<string, any>) => Promise<void>,
) => {
	let outputCallbackPromises: Promise<void>[] = [];

	// we gather all outputs to be set in one object
	// to only call the batch update once
	// this is necessary as multiple instances might want to set the same parameter
	const outputReturns: {
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
				acc[key] = JSON.stringify(value);
				return acc;
			},
			{} as Record<string, any>,
		);
		outputCallbackPromises.push(
			batchParameterValueUpdate({
				[namespace]: param,
			}),
		);
	}

	return outputCallbackPromises;
};
