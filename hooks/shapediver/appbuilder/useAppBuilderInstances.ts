import {useShapeDiverStoreProcessManager} from "@AppBuilderShared/store/useShapeDiverStoreProcessManager";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {IAppBuilder} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Mat4Array} from "@AppBuilderShared/types/shapediver/common";
import {ISessionApi, ITreeNode} from "@shapediver/viewer.session";
import {mat4} from "gl-matrix";
import {useCallback, useEffect, useMemo, useState} from "react";

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

	/**
	 * Parse the app builder data.
	 * Gather all the necessary information to create the instances.
	 */
	const appBuilderInstances = useMemo(() => {
		if (!appBuilderData) return [];
		const instances = appBuilderData.instances ?? [];

		const parsedInstances: {
			session: ISessionApi;
			parameterSet: {[key: string]: string};
			transformations?: number[][];
			originalIndex: number;
		}[] = [];

		instances.forEach((instance, index) => {
			const session = sessions[instance.sessionId];
			if (!session) return;

			const parameterSetWithIds: {[key: string]: string} = {};

			Object.entries(instance.parameterSet ?? {}).map(([key, value]) => {
				const parameter = session.getParameterByName(key);
				if (parameter.length === 0) return;
				parameterSetWithIds[parameter[0].id] = value;
			});

			parsedInstances.push({
				session,
				parameterSet: parameterSetWithIds,
				transformations: instance.transformations,
				originalIndex: index,
			});
		});

		return parsedInstances;
	}, [appBuilderData, sessions]);

	const [instances, setInstances] = useState<ITreeNode[]>([]);

	const sessionUpdateCallback = useCallback(
		(newNode?: ITreeNode) => {
			if (!newNode) return;
			instances.forEach((instance) => {
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

		appBuilderInstances.forEach((instance) => {
			const promise = instance.session
				.customizeParallel(instance.parameterSet)
				.then((node) => {
					// once the node is created, add the transformations
					instance.transformations?.forEach(
						(transformation, index) => {
							// TODO add proper naming scheme
							const clone = node.cloneInstance();

							// we have to transpose the matrix
							// because of different column/row major order
							const transformationMatrix = mat4.transpose(
								mat4.create(),
								mat4.fromValues(
									...(transformation as unknown as Mat4Array),
								),
							);

							clone.addTransformation({
								id:
									"transformation_" +
									instance.originalIndex +
									"_" +
									index,
								matrix: transformationMatrix,
							});

							setInstances((prev) => [...prev, clone]);
						},
					);
				});

			if (!processId) return;
			// add the promise to the process manager
			// once all registered promises are resolved, the viewports are updated
			// and the process manager is removed from the store
			addPromise(processId, promise);
		});

		return () => {
			setInstances([]);
		};
	}, [appBuilderInstances, processId]);
}
