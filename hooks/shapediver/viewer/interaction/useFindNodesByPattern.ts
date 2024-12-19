import { gatherNodesForPattern, NodeNameFilterPattern } from "@shapediver/viewer.features.interaction";
import { ITreeNode, OutputApiData, SessionApiData } from "@shapediver/viewer.session";
import { useCallback, useEffect, useState } from "react";
import { useOutputNode } from "../useOutputNode";

// #region Type aliases (2)

type IFindNodesByPatternHandlerState = {
	sessionId: string;
	outputIdOrName: string;
	patterns: NodeNameFilterPattern[];
	strictNaming?: boolean;
	setData?: React.Dispatch<React.SetStateAction<IFindNodesByPatternState>>;
};
export type IFindNodesByPatternState = {
	/**
	 * The available nodes for the given output and patterns.
	 */
	nodes: ITreeNode[]
};

// #endregion Type aliases (2)

// #region Functions (1)

/**
 * Hook for finding nodes in the scene tree that match the given patterns.
 * 
 * Makes use of {@link useOutputNode}.
 * 
 * @param patterns The patterns for matching the node names of the given output
 * 
 * @returns 
 */
export function useFindNodesByPattern(
	sessionId: string,
	outputIdOrName: string,
	patterns: NodeNameFilterPattern[],
	strictNaming = true
): {
    /**
     * The available nodes for the given output and patterns.
     */
    nodes: ITreeNode[]
} {
	const [nodes, setNodes] = useState<ITreeNode[]>([]);

	/**
     * Output update callback for gathering the nodes. 
     * 
     * @param node
     */
	const callback = useCallback((newNode?: ITreeNode, oldNode?: ITreeNode) => {
		if (oldNode && !newNode) {
			// clear the available node names if the node is removed
			setNodes([]);
		} else if (newNode) {
			let outputApi = newNode.data.find((data) => data instanceof OutputApiData)?.api;
			if (!outputApi) {
				// try to find it in the session api
				const sessionApi = newNode.parent?.data.find((data) => data instanceof SessionApiData)?.api;
				if(!sessionApi) return;

				outputApi = sessionApi.outputs[newNode.name];
				if(!outputApi) return;
			}

			const availableNodes: { [nodeId: string]: { node: ITreeNode, name: string } } = {};
			for (const pattern of patterns) {
				if (pattern.length === 0) {
					availableNodes[newNode.id] = {
						node: newNode,
						name: outputApi.name
					};
				} else {
					for(const child of newNode.children) {
						gatherNodesForPattern(child, pattern, outputApi.name, availableNodes, 0, strictNaming);
					}
				}
			}
	
			setNodes(Object.values(availableNodes).map(n => n.node));
		}

	}, [patterns]);

	// define the node update callback
	useOutputNode(sessionId, outputIdOrName, callback);

	return {
		nodes
	};
}

// #endregion Functions (1)

// #region Variables (1)

export const FindNodesByPatternHandler: React.FC<IFindNodesByPatternHandlerState> = ({ sessionId, outputIdOrName, patterns, strictNaming, setData }: IFindNodesByPatternHandlerState) => {
	const { nodes } = useFindNodesByPattern(sessionId, outputIdOrName, patterns, strictNaming);
	useEffect(() => {
		if (setData)
			setData({
				nodes
			});
	}, [nodes]);

	return null;
};

// #endregion Variables (1)
