import {useShapeDiverStoreInstances} from "@AppBuilderShared/store/useShapeDiverStoreInstances";
import {useShapeDiverStoreProcessManager} from "@AppBuilderShared/store/useShapeDiverStoreProcessManager";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {IAppBuilder} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Mat4Array} from "@AppBuilderShared/types/shapediver/common";
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
	processId: string | undefined;
}

/**
 * Hook for creating app builder instances.
 * This hook parses the app builder data and creates instances in the viewer.
 * The instances are created with the correct parameter set and transformations.
 *
 * @param props
 */
export function useAppBuilderInstances(props: Props) {
	const {sessionApi, appBuilderData, processId} = props;

	const {sessions, addSessionUpdateCallback} = useShapeDiverStoreSession();
	const {addPromise} = useShapeDiverStoreProcessManager();
	const {addInstance, removeInstance} = useShapeDiverStoreInstances();

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
			parameters: {[key: string]: string};
			transformations?: number[][];
			originalIndex: number;
			name?: string;
		}[] = [];

		instances.forEach((instance, index) => {
			const session = sessions[instance.sessionId];
			if (!session) return;

			const parametersWithIds: {[key: string]: string} = {};

			Object.entries(instance.parameters ?? {}).map(([key, value]) => {
				// first, check the display name
				Object.values(session.parameters).forEach((parameter) => {
					if (parameter.displayname !== key) return;
					parametersWithIds[parameter.id] = value;
				});
				// if the display name is not found, check the name
				if (parametersWithIds[key]) return;
				const parameterByName = session.getParameterByName(key);
				if (parameterByName.length > 0) {
					parametersWithIds[parameterByName[0].id] = value;
					return;
				}

				// if the parameter is not found, we search by id
				const parameterById = session.getParameterById(key);
				if (parameterById) parametersWithIds[key] = value;
			});

			parsedInstances.push({
				session,
				parameters: parametersWithIds,
				transformations: instance.transformations,
				originalIndex: index,
				name: instance.name,
			});
		});

		return parsedInstances;
	}, [appBuilderData, sessions]);

	useEffect(() => {
		for (const instanceId in instances) {
			addInstance(instanceId, instances[instanceId]);
		}

		return () => {
			for (const instanceId in instances) {
				removeInstance(instanceId);
			}
		};
	}, [instances]);

	const sessionUpdateCallback = useCallback(
		(newNode?: ITreeNode) => {
			sessionNodeRef.current = newNode;
			if (!newNode) return;
			Object.values(instances).forEach((instance) => {
				if (newNode.hasChild(instance)) return;

				// add the instance to the controller session node
				newNode.addChild(instance);
				// update the version of the node
				// this won't be triggered as long as a process is running
				newNode.updateVersion();
			});
		},
		[instances],
	);

	useEffect(() => {
		const removeSessionUpdateCallback = addSessionUpdateCallback(
			sessionApi?.id ?? "",
			sessionUpdateCallback,
		);

		return removeSessionUpdateCallback;
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
		if (processId) addPromise(processId, mainPromise);

		const newInstances: {
			[key: string]: ITreeNode;
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

			const promise = instance.session
				.customizeParallel(instance.parameters)
				.then((node) => {
					// send a progress update
					progressCallback({
						percentage: 0.75,
						msg: "Applying transformations to instance",
					});

					const instanceId =
						instance.name ?? `instances[${instance.originalIndex}]`;
					const instanceNode = new TreeNode(instanceId);
					instanceNode.originalName = instanceId;

					// once the node is created, add the transformations
					instance.transformations?.forEach(
						(transformation, index) => {
							const transformationId = `transformations[${index}]`;
							const transformationNode = new TreeNode(
								transformationId,
							);
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
								transformationNode.addChild(
									child.cloneInstance(),
								);
							}

							instanceNode.addChild(transformationNode);
						},
					);

					// send a progress update
					progressCallback({
						percentage: 0.9,
						msg: "Adding instance to scene",
					});

					newInstances[instanceId] = instanceNode;
				});

			promises.push(promise);

			if (!processId) return;
			// add the promise to the process manager
			// once all registered promises are resolved, the viewports are updated
			// and the process manager is removed from the store
			addPromise(processId, promise, onProgressCallback);
		});

		// wait for all promises to resolve
		// then update the instances to avoid unnecessary re-renders
		Promise.all(promises).then(() => {
			setInstances(newInstances);

			// we add the instances to the controller session node
			// this is necessary to happen before the process is finished
			if (sessionNodeRef.current) {
				Object.values(newInstances).forEach((instance) => {
					if (sessionNodeRef.current!.hasChild(instance)) return;

					// add the instance to the controller session node
					sessionNodeRef.current!.addChild(instance);
					// update the version of the node
					// this won't be triggered as long as a process is running
					sessionNodeRef.current!.updateVersion();
				});
			}

			// resolve the main promise
			// to signal that the process is finished
			resolveMainPromise!();
		});

		return () => {
			setInstances({});
		};
	}, [appBuilderInstances, processId]);
}
