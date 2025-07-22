import {useShapeDiverStoreInstances} from "@AppBuilderShared/store/useShapeDiverStoreInstances";
import {useShapeDiverStoreProcessManager} from "@AppBuilderShared/store/useShapeDiverStoreProcessManager";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {IAppBuilder} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Mat4Array} from "@AppBuilderShared/types/shapediver/common";
import {IProcessDefinition} from "@AppBuilderShared/types/store/shapediverStoreProcessManager";
import {ISessionApi, ITreeNode, TreeNode} from "@shapediver/viewer.session";
import {mat4} from "gl-matrix";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";

interface Props {
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

/**
 * Hook for creating app builder instances.
 * This hook parses the app builder data and creates instances in the viewer.
 * The instances are created with the correct parameter set and transformations.
 *
 * @param props
 */
export function useAppBuilderInstances(props: Props) {
	const {
		sessionApi,
		appBuilderData,
		processManagerId: sessionProcessManagerId,
	} = props;

	const {sessions, addSessionUpdateCallback} = useShapeDiverStoreSession();
	const {addProcess, createProcessManager} =
		useShapeDiverStoreProcessManager();
	const {
		addCustomizationResult,
		removeCustomizationResult,
		customizationResults,
		addInstance,
		removeInstance,
	} = useShapeDiverStoreInstances();

	const [instances, setInstances] = useState<{
		[key: string]: ITreeNode;
	}>({});

	const sessionNodeRef = useRef<ITreeNode | undefined>(undefined);

	/**
	 * Parse the app builder data.
	 * Gather all the necessary information to create the instances.
	 */
	const appBuilderInstances = useMemo(() => {
		if (!appBuilderData) return [];
		const instances = appBuilderData.instances ?? [];

		const parsedInstances: {
			session: ISessionApi;
			parameterValues: {[key: string]: string};
			transformations?: number[][];
			originalIndex: number;
			name?: string;
		}[] = [];

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
			});
		});

		return parsedInstances;
	}, [appBuilderData, sessions]);

	const instancesRef = useRef<{
		[key: string]: ITreeNode;
	}>({});

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

	const customizationResultInStoreRef = useRef(customizationResults);

	useEffect(() => {
		customizationResultInStoreRef.current = customizationResults;
	}, [customizationResults]);

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

		const processManagerId =
			sessionProcessManagerId || createProcessManager(sessionApi.id);
		addProcess(processManagerId, mainProcessDefinition);

		const newInstances: {
			[key: string]: ITreeNode;
		} = {};
		const customizationResultPromise: {
			[key: string]: Promise<ITreeNode>;
		} = {};
		const promises: Promise<void>[] = [];

		appBuilderInstances.forEach((instance) => {
			// create a callback function for the progress
			let progressCallback: (progress: {
				percentage: number;
				msg?: string;
			}) => void;

			// create a function to register the progress callback
			const onProgressCallback = (
				callback: (progress: {
					percentage: number;
					msg?: string;
				}) => void,
			) => {
				progressCallback = callback;
			};

			// convert the parameter values to a JSON string
			const parameterValuesJson = JSON.stringify(
				instance.parameterValues,
			);

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
			if (
				customizationResultInStoreRef.current[instanceCustomizationId]
			) {
				creationPromise = Promise.resolve(
					customizationResultInStoreRef.current[
						instanceCustomizationId
					],
				);
				customizationResultPromise[instanceCustomizationId] =
					creationPromise;
			} else if (
				customizationResultPromise[instanceCustomizationId] !==
				undefined
			) {
				creationPromise =
					customizationResultPromise[instanceCustomizationId];
			} else {
				creationPromise = instance.session
					.customizeParallel(instance.parameterValues)
					.then((node) => {
						addCustomizationResult(instanceCustomizationId, node);
						return node;
					});
				customizationResultPromise[instanceCustomizationId] =
					creationPromise;
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
						mat4.fromValues(
							...(transformation as unknown as Mat4Array),
						),
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

				newInstances[instanceName] = instanceNode;
			});

			promises.push(promise);

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
		});

		// wait for all promises to resolve
		// then update the instances to avoid unnecessary re-renders
		Promise.all(promises).then(() => {
			// we add the instances to the controller session node
			// and remove the old instances from the session node
			// this is necessary to happen before the process is finished
			if (sessionNodeRef.current) {
				// remove the old instances from the session node
				Object.values(instancesRef.current).forEach((instance) => {
					if (sessionNodeRef.current!.hasChild(instance)) {
						sessionNodeRef.current!.removeChild(instance);
					}
				});

				Object.values(newInstances).forEach((instance) => {
					if (sessionNodeRef.current!.hasChild(instance)) return;

					// add the instance to the controller session node
					sessionNodeRef.current!.addChild(instance);
					// update the version of the node
					// this won't be triggered as long as a process is running
					sessionNodeRef.current!.updateVersion();
				});
			}

			setInstances(newInstances);

			// resolve the main promise
			// to signal that the process is finished
			resolveMainPromise!();

			// clean up the session instances
			// only instances that are currently in the scene are kept
			// the others are removed from the store
			Object.keys(customizationResultInStoreRef.current).forEach(
				(instanceId) => {
					if (customizationResultPromise[instanceId] !== undefined)
						return;
					removeCustomizationResult(instanceId);
				},
			);
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
	}, [appBuilderInstances, sessionProcessManagerId]);
}
