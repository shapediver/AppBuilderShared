import { addInteractionData, gatherNodesForPattern, InteractionData, MultiSelectManager, NodeNameFilterPattern, SelectManager } from "@shapediver/viewer.features.interaction";
import { IOutputApi, ITreeNode, OutputApiData, SessionApiData } from "@shapediver/viewer.session";
import { useCallback, useEffect, useState } from "react";
import { useOutputNode } from "../useOutputNode";
import { vec3 } from "gl-matrix";

// #region Type aliases (2)

type INodeInteractionDataHandlerState = {
	sessionId: string;
	componentId: string;
	outputIdOrName: string;
	patterns: NodeNameFilterPattern[];
	interactionSettings: { select?: boolean, hover?: boolean, drag?: boolean, dragOrigin?: vec3, dragAnchors?: { id: string, position: vec3, rotation?: { angle: number, axis: vec3 } }[] };
	selectManager?: SelectManager | MultiSelectManager;
	strictNaming?: boolean;
	setData?: React.Dispatch<React.SetStateAction<INodeInteractionDataState>>;
};
export type INodeInteractionDataState = {
	/**
	 * API of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
	 */
	outputApi: IOutputApi | undefined,
	/**
	 * Scene tree node of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html#node
	 */
	outputNode: ITreeNode | undefined,
	/**
	 * The available node names for the given output and patterns.
	 */
	availableNodeNames: string[]
};

// #endregion Type aliases (2)

// #region Functions (1)

/**
 * Hook for managing interaction data for the nodes of an output. 
 * Use this hook for defining which nodes are selectable, hoverable, or draggable. 
 * 
 * @see https://viewer.shapediver.com/v3/latest/api/features/interaction/interfaces/IInteractionData.html
 * 
 * Makes use of {@link useOutputNode}.
 * 
 * @param sessionId The ID of the session.
 * @param componentId The ID of the component.
 * @param outputIdOrName The ID or name of the output.
 * @param patterns The patterns for matching the node names of the given output
 * @param interactionSettings The settings for the interaction data.
 * @param selectManager The select manager to be used for selection.
 * If not provided, the selection will not be possible, but the interaction data will be added.
 * 
 * @returns 
 */
export function useNodeInteractionData(
	sessionId: string,
	componentId: string,
	outputIdOrName: string,
	patterns: NodeNameFilterPattern[],
	interactionSettings: { select?: boolean, hover?: boolean, drag?: boolean, dragOrigin?: vec3, dragAnchors?: { id: string, position: vec3, rotation?: { angle: number, axis: vec3 } }[] },
	selectManager?: SelectManager | MultiSelectManager,
	strictNaming = true
): INodeInteractionDataState {
	const [availableNodeNames, setAvailableNodeNames] = useState<string[]>([]);

	/**
	 * Output update callback for adding interaction data. 
	 * 
	 * @param node
	 */
	const callback = useCallback((newNode?: ITreeNode, oldNode?: ITreeNode) => {
		// remove interaction data on deregistration
		if (oldNode) {
			oldNode.traverse(node => {
				for (const data of node.data) {
					// remove existing interaction data if it is restricted to the current component
					if (data instanceof InteractionData && data.restrictedManagers.includes(componentId)) {
						if (data.interactionStates.select === true)
							selectManager?.deselect(node);
						node.removeData(data);
						node.updateVersion();
					}
				}
			});
		}

		if (newNode) {
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
			Object.values(availableNodes).forEach(availableNode => {
				addInteractionData(availableNode.node, interactionSettings, componentId);
			});

			setAvailableNodeNames(Object.values(availableNodes).map(n => n.name));
		}

		// clear the available node names if the node is removed
		if (oldNode && !newNode) {
			setAvailableNodeNames([]);
		}

	}, [patterns, interactionSettings, selectManager]);

	// define the node update callback
	const { outputApi, outputNode } = useOutputNode(sessionId, outputIdOrName, callback);

	return {
		outputApi,
		outputNode,
		availableNodeNames
	};
}

// #endregion Functions (1)

// #region Variables (1)

/**
 * Node interaction data handler component.
 * This component is used to handle the interaction data for the nodes of an output.
 * It will register the interaction data for the nodes of the output.
 * 
 * @param props The props
 * @returns 
 */
export const NodeInteractionDataHandler: React.FC<INodeInteractionDataHandlerState> = ({ sessionId, componentId, outputIdOrName, patterns, interactionSettings, selectManager, strictNaming, setData }: INodeInteractionDataHandlerState) => {
	const { outputApi, outputNode, availableNodeNames } = useNodeInteractionData(sessionId, componentId, outputIdOrName, patterns, interactionSettings, selectManager, strictNaming);
	useEffect(() => {
		if (setData)
			setData({
				outputApi,
				outputNode,
				availableNodeNames
			});
	}, [outputApi, outputNode, availableNodeNames, setData]);

	return null;
};

// #endregion Variables (1)
