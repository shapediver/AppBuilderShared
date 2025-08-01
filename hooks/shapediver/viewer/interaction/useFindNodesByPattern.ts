import {useShapeDiverStoreInstances} from "@AppBuilderShared/store/useShapeDiverStoreInstances";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {UpdateCallbackType} from "@AppBuilderShared/types/store/shapediverStoreSession";
import {
	gatherNodesForPattern,
	NodeNameFilterPattern,
} from "@shapediver/viewer.features.interaction";
import {
	ITreeNode,
	OutputApiData,
	SessionApiData,
} from "@shapediver/viewer.session";

import {useCallback, useEffect, useState} from "react";

export type IUseFindNodesByPatternProps = {
	/**
	 * The ID of the output.
	 */
	outputId?: string;

	/**
	 * The patterns to find the nodes.
	 */
	patterns: NodeNameFilterPattern[];

	/**
	 * The ID of the session.
	 */
	sessionId?: string;

	/**
	 * Whether to use strict naming. (default: false)
	 */
	strictNaming?: boolean;

	/**
	 * The ID of the instance.
	 */
	instanceId?: string;
};

export type IUseFindNodesByPatternResult = ITreeNode[];

/**
 * Create a callback function that updates the available nodes based on the given patterns.
 * This functions is used to create the callback function that is used to update the available nodes.
 * The callback function is used to update the available nodes when the output is updated.
 *
 */
const createCallback = (
	setNodes: (nodes: ITreeNode[]) => void,
	patterns: NodeNameFilterPattern[],
	strictNaming?: boolean,
): UpdateCallbackType => {
	return (newNode?: ITreeNode, oldNode?: ITreeNode) => {
		if (oldNode && !newNode) {
			// clear the available node names if the node is removed
			setNodes([]);
		} else if (newNode) {
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

			setNodes(Object.values(availableNodes).map((n) => n.node));
		}
	};
};

/**
 * Gather the nodes for the given instance based on the patterns.
 * This function is used to gather the nodes for the given instance when no session ID or output ID is provided.
 *
 * @param setNodes The function to set the nodes.
 * @param instance The instance node to gather the nodes from.
 * @param patterns The patterns to match the node names.
 * @param strictNaming Whether to use strict naming.
 * @returns A function to remove the callback.
 */
const instanceCallback = (
	setNodes: (nodes: ITreeNode[]) => void,
	instance: ITreeNode,
	patterns: NodeNameFilterPattern[],
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

	setNodes(
		Object.values(availableNodes).map(
			(availableNode) => availableNode.node,
		),
	);
};

/**
 * Find the nodes based on the given patterns.
 * It will update the nodes whenever the output is updated.
 * If you want to find the nodes base on multiple properties, use {@link useFindNodesByPatterns} instead.
 *
 * @param props
 * @returns
 */
export function useFindNodesByPattern(props: IUseFindNodesByPatternProps): {
	nodes: IUseFindNodesByPatternResult;
} {
	const [nodes, setNodes] = useState<IUseFindNodesByPatternResult>([]);
	const {addOutputUpdateCallback} = useShapeDiverStoreSession();
	const instances = useShapeDiverStoreInstances((state) => state.instances);

	useEffect(() => {
		if (!props.sessionId || !props.outputId) return;
		const callback = createCallback(
			setNodes,
			props.patterns,
			props.strictNaming,
		);
		const removeOutputUpdateCallback = addOutputUpdateCallback(
			props.sessionId,
			props.outputId,
			callback,
		);
		return removeOutputUpdateCallback;
	}, [props]);

	useEffect(() => {
		if (!props.instanceId) return;
		const instance = instances[props.instanceId];
		if (!instance) return;
		instanceCallback(
			setNodes,
			instance,
			props.patterns,
			props.strictNaming,
		);
	}, [props, instances]);

	return {
		nodes,
	};
}

/**
 * Find the nodes based on the given patterns.
 * It will update the nodes whenever the output is updated.
 * If you want to find the nodes base on multiple properties, use {@link useFindNodesByPatterns} instead.
 *
 * @param props
 * @returns
 */
export function useFindNodesByPatterns(props: {
	[key: string]: IUseFindNodesByPatternProps;
}): {nodes: {[key: string]: IUseFindNodesByPatternResult}} {
	const [nodes, setNodes] = useState<{
		[key: string]: IUseFindNodesByPatternResult;
	}>({});
	const {addOutputUpdateCallback} = useShapeDiverStoreSession();
	const instances = useShapeDiverStoreInstances((state) => state.instances);

	const setNodesAtKey = useCallback((key: string) => {
		return (newNodes: IUseFindNodesByPatternResult) => {
			setNodes((oldNodes) => {
				const newNodesMap = {...oldNodes};
				newNodesMap[key] = newNodes;
				return newNodesMap;
			});
		};
	}, []);

	useEffect(() => {
		const removeOutputUpdateCallbacks: (() => void)[] = [];
		Object.entries(props).forEach(([key, prop]) => {
			if (!prop.sessionId || !prop.outputId) return;
			const callback = createCallback(
				setNodesAtKey(key),
				prop.patterns,
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
	}, [props]);

	useEffect(() => {
		Object.entries(props).forEach(([key, prop]) => {
			if (!prop.instanceId) return;
			const instance = instances[prop.instanceId];
			if (!instance) return;
			// if no session ID or output ID is provided, we assume that this is an instance
			instanceCallback(
				setNodesAtKey(key),
				instance,
				prop.patterns,
				prop.strictNaming,
			);
		});
	}, [instances, props]);

	return {
		nodes,
	};
}
