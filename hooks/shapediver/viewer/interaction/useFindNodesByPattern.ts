import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {UpdateCallbackType} from "@AppBuilderShared/types/store/shapediverStoreSession";
import {
	NodeNameFilterPattern,
	gatherNodesForPattern,
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
	outputId: string;

	/**
	 * The patterns to find the nodes.
	 */
	patterns: NodeNameFilterPattern[];

	/**
	 * The ID of the session.
	 */
	sessionId: string;

	/**
	 * Whether to use strict naming. (default: false)
	 */
	strictNaming?: boolean;
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

	useEffect(() => {
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

	return {
		nodes,
	};
}
