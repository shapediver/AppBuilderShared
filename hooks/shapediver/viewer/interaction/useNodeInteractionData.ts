import {useShapeDiverStoreInstances} from "@AppBuilderShared/store/useShapeDiverStoreInstances";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {
	addInteractionData,
	gatherNodesForPattern,
	InteractionData,
	MultiSelectManager,
	NodeNameFilterPattern,
	SelectManager,
} from "@shapediver/viewer.features.interaction";
import {
	ITreeNode,
	OutputApiData,
	SessionApiData,
} from "@shapediver/viewer.session";
import {vec3} from "gl-matrix";
import {useCallback, useEffect, useState} from "react";

export type IUseNodeInteractionDataProps = {
	/**
	 * The ID of the session.
	 */
	sessionId?: string;
	/**
	 * The ID of the component.
	 */
	componentId: string;
	/**
	 * The ID of the output.
	 */
	outputId?: string;
	/**
	 * The patterns for matching the node names of the given output
	 */
	patterns: NodeNameFilterPattern[];
	/**
	 * The settings for the interaction data.
	 */
	interactionSettings: {
		/**
		 * If the nodes should be selectable.
		 */
		select?: boolean;
		/**
		 * If the nodes should be hoverable.
		 */
		hover?: boolean;
		/**
		 * If the nodes should be draggable.
		 */
		drag?: boolean;
		/**
		 * The origin of the drag.
		 */
		dragOrigin?: vec3;
		/**
		 * The anchors for the drag.
		 */
		dragAnchors?: {
			id: string;
			position: vec3;
			rotation?: {angle: number; axis: vec3};
		}[];
	};
	/**
	 * The select manager to be used for selection.
	 * If not provided, the selection will not be possible, but the interaction data will be added.
	 */
	selectManager?: SelectManager | MultiSelectManager;
	/**
	 * If the naming should be strict.
	 */
	strictNaming?: boolean;
};

export type IUseNodeInteractionDataResult = string[];

/**
 * Creates an output update callback for the given properties.
 * This output update callback will add interaction data to the nodes of the given output.
 *
 * It is added/removed via the {@link useShapeDiverStoreSession} store.
 *
 * @param setAvailableNodeNames The setter for the available node names.
 * @param patterns The patterns for matching the node names of the given output.
 * @param interactionSettings The settings for the interaction data.
 * @param componentId The ID of the component.
 * @param selectManager The select manager to be used for selection.
 * @param strictNaming If the naming should be strict.
 *
 * @returns The output update callback.
 */
const createOutputUpdateCallback = (
	setAvailableNodeNames: (names: IUseNodeInteractionDataResult) => void,
	patterns: NodeNameFilterPattern[],
	interactionSettings: IUseNodeInteractionDataProps["interactionSettings"],
	componentId: string,
	selectManager?: SelectManager | MultiSelectManager,
	strictNaming?: boolean,
) => {
	return (newNode?: ITreeNode, oldNode?: ITreeNode) => {
		// remove interaction data on deregistration
		if (oldNode) {
			oldNode.traverse((node) => {
				for (const data of node.data) {
					// remove existing interaction data if it is restricted to the current component
					if (
						data instanceof InteractionData &&
						data.restrictedManagers.includes(componentId)
					) {
						if (data.interactionStates.select === true)
							selectManager?.deselect(node);
						node.removeData(data);
						node.updateVersion();
					}
				}
			});
		}

		if (newNode) {
			let outputApi = newNode.data.find(
				(data) => data instanceof OutputApiData,
			)?.api;
			// it's possible that the OutputApiData is not available yet, so we need to find it in the session api
			if (!outputApi) {
				// try to find it in the session api
				const sessionApi = newNode.parent?.data.find(
					(data) => data instanceof SessionApiData,
				)?.api;
				if (!sessionApi) return;

				outputApi = sessionApi.outputs[newNode.name];
				if (!outputApi) return;
			}

			const availableNodes: {
				[nodeId: string]: {node: ITreeNode; name: string};
			} = {};
			for (const pattern of patterns) {
				if (pattern.length === 0) {
					availableNodes[newNode.id] = {
						node: newNode,
						name: outputApi.name,
					};
				} else {
					for (const child of newNode.children) {
						gatherNodesForPattern(
							child,
							pattern,
							outputApi.name,
							availableNodes,
							0,
							strictNaming,
						);
					}
				}
			}
			Object.values(availableNodes).forEach((availableNode) => {
				addInteractionData(
					availableNode.node,
					interactionSettings,
					componentId,
				);
			});

			setAvailableNodeNames(
				Object.values(availableNodes).map((n) => n.name),
			);
		}

		// clear the available node names if the node is removed
		if (oldNode && !newNode) {
			setAvailableNodeNames([]);
		}
	};
};

/**
 * The instance callback to assign the interaction data to the nodes of the given instance.
 * This is used if no session ID or output ID is provided.
 * The interaction data will be added to the nodes of the given instance.
 *
 * Compared to the output update callback, this callback does not need to be added/removed via the {@link useShapeDiverStoreSession} store.
 * It can be called directly.
 *
 * @param instance The instance to assign the interaction data to.
 * @param setAvailableNodeNames The setter for the available node names.
 * @param patterns The patterns for matching the node names of the given instance.
 * @param interactionSettings The settings for the interaction data.
 * @param componentId The ID of the component.
 * @param strictNaming If the naming should be strict.
 *
 * @returns The cleanup function to remove the interaction data.
 */
const instanceCallback = (
	instance: ITreeNode,
	setAvailableNodeNames: (names: IUseNodeInteractionDataResult) => void,
	patterns: NodeNameFilterPattern[],
	interactionSettings: IUseNodeInteractionDataProps["interactionSettings"],
	componentId: string,
	strictNaming?: boolean,
) => {
	const availableNodes: {
		[nodeId: string]: {node: ITreeNode; name: string};
	} = {};
	for (const pattern of patterns) {
		if (pattern.length === 0) {
			availableNodes[instance.id] = {
				node: instance,
				name: instance.name,
			};
		} else {
			for (const child of instance.children) {
				gatherNodesForPattern(
					child,
					pattern,
					instance.name,
					availableNodes,
					0,
					strictNaming,
				);
			}
		}
	}
	Object.values(availableNodes).forEach((availableNode) => {
		addInteractionData(
			availableNode.node,
			interactionSettings,
			componentId,
		);
	});

	setAvailableNodeNames(Object.values(availableNodes).map((n) => n.name));

	return () => {
		// remove the interaction data on unmount
		Object.values(availableNodes).forEach((availableNode) => {
			availableNode.node.traverse((node) => {
				for (const data of node.data) {
					// remove existing interaction data if it is restricted to the current component
					if (
						data instanceof InteractionData &&
						data.restrictedManagers.includes(componentId)
					) {
						node.removeData(data);
						node.updateVersion();
					}
				}
			});
		});
	};
};

export function useNodesInteractionData(props: {
	[key: string]: IUseNodeInteractionDataProps;
}): {
	availableNodeNames: {
		[key: string]: IUseNodeInteractionDataResult;
	};
} {
	const [availableNodeNames, setAvailableNodeNames] = useState<{
		[key: string]: IUseNodeInteractionDataResult;
	}>({});
	const instances = useShapeDiverStoreInstances((state) => state.instances);
	const {addOutputUpdateCallback} = useShapeDiverStoreSession();

	const setAvailableNodeNamesAtKey = useCallback((key: string) => {
		return (newNames: IUseNodeInteractionDataResult) => {
			setAvailableNodeNames((oldNames) => {
				const newNamesMap = {...oldNames};
				newNamesMap[key] = newNames;
				return newNamesMap;
			});
		};
	}, []);

	useEffect(() => {
		const removeOutputUpdateCallbacks: (() => void)[] = [];
		Object.entries(props).forEach(([key, prop]) => {
			if (!prop.sessionId || !prop.outputId) return;
			const callback = createOutputUpdateCallback(
				setAvailableNodeNamesAtKey(key),
				prop.patterns,
				prop.interactionSettings,
				prop.componentId,
				prop.selectManager,
				prop.strictNaming,
			);

			removeOutputUpdateCallbacks.push(
				addOutputUpdateCallback(
					prop.sessionId,
					prop.outputId,
					callback,
				),
			);
		});

		return () => {
			removeOutputUpdateCallbacks.forEach((removeOutputUpdateCallback) =>
				removeOutputUpdateCallback(),
			);
		};
	}, [props, instances]);

	useEffect(() => {
		const removeInstanceCallbacks: (() => void)[] = [];

		Object.entries(props).forEach(([key, prop]) => {
			if (prop.sessionId !== undefined && prop.outputId !== undefined)
				return;
			if (!instances[key]) return;
			// if no session ID or output ID is provided, we assume that this is an instance
			// for instances we can assign the data directly
			removeInstanceCallbacks.push(
				instanceCallback(
					instances[key],
					setAvailableNodeNamesAtKey(key),
					prop.patterns,
					prop.interactionSettings,
					prop.componentId,
					prop.strictNaming,
				),
			);
		});

		return () => {
			removeInstanceCallbacks.forEach((removeInstanceCallback) =>
				removeInstanceCallback(),
			);
		};
	}, [instances, props]);

	return {
		availableNodeNames,
	};
}
