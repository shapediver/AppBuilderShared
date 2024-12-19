import { IDraggingParameterProps, DraggingParameterValue } from "@shapediver/viewer.session";
import { getNodesByName } from "@shapediver/viewer.features.interaction";
import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useDragManager } from "./useDragManager";
import { useHoverManager } from "../selection/useHoverManager";
import { useDragManagerEvents } from "./useDragManagerEvents";
import { useConvertDraggingData } from "../useConvertDraggingData";
import { NodeInteractionDataHandler } from "../useNodeInteractionData";
import { useShapeDiverStoreSession } from "shared/store/useShapeDiverStoreSession";
import { mat4 } from "gl-matrix";
import { useRestrictions } from "../../drawing/useRestrictions";

/**
 * Hook providing stateful object dragging for a viewport and session. 
 * This wraps lover level hooks for the drag manager, hover manager, and node interaction data.
 * 
 * @param sessionIds IDs of the sessions for which objects shall be dragged.
 * @param viewportId ID of the viewport for which dragging shall be enabled. 
 * @param draggingProps Parameter properties to be used. This includes name filters, and properties for the behavior of the dragging.
 * @param activate Set this to true to activate dragging. If false, preparations are made but no dragging is possible.
 * @param initialDraggedNodeNames The initial dragged node names (used to initialize the dragging state).
 * 					Note that this initial state is not checked against the filter pattern. 
 */
export function useDragging(
	sessionIds: string[],
	viewportId: string,
	draggingProps: IDraggingParameterProps,
	activate: boolean,
	initialDraggedNodes?: DraggingParameterValue["objects"],
	strictNaming = true
): {
	/**
	 * The dragged nodes.
	 */
    draggedNodes: DraggingParameterValue["objects"],
	/**
	 * Set the dragged nodes.
	 */
	setDraggedNodes: (nodes: DraggingParameterValue["objects"]) => void,
	/**
	 * Reset the dragged nodes.
	 */
	resetDraggedNodes: () => void,
	/**
	 * Restore the dragged nodes to a previous state.
	 */
	restoreDraggedNodes: (lastDraggedNodes: DraggingParameterValue["objects"] | undefined, currentDraggedNodes: DraggingParameterValue["objects"]) => void,
	/**
	 * The handlers to be added to the document.
	 */
	handlers: JSX.Element[]
} {
	// get the session API
	const sessionApis = useShapeDiverStoreSession(state => { return sessionIds.map(id => state.sessions[id]); });
	// create a unique component ID
	const componentId = useId();

	// use the restrictions
	const { restrictions, handlers } = useRestrictions(draggingProps.restrictions);

	// call the drag manager hook
	useDragManager(viewportId, componentId, activate ? draggingProps : undefined);

	// convert the dragging data
	const { objects } = useConvertDraggingData(sessionIds, draggingProps);
		
	// call the hover manager hook
	const hoverSettings = useMemo(() => { return { hoverColor: draggingProps.hoverColor }; }, [draggingProps]);
	useHoverManager(viewportId, componentId, activate ? hoverSettings : undefined);

	// call the drag manager events hook
	const { draggedNodes, setDraggedNodes, resetDraggedNodes } = useDragManagerEvents(objects, restrictions, componentId, initialDraggedNodes, strictNaming);

	// create a state for the node interaction data handlers
	const [nodeInteractionDataHandlers, setNodeInteractionDataHandles] = useState<JSX.Element[]>([]);

	/**
	 * useEffect to create the node interaction data handlers.
	 * for each object, create a node interaction data handler with varying interaction settings.
	 */
	useEffect(() => {
		const nodeInteractionDataHandlers: JSX.Element[] = [];
		objects.forEach(object =>
			Object.entries(object.patterns).forEach(([sessionId, sessionData]) =>
				Object.entries(sessionData).forEach(([outputId, pattern]) =>
				{
					// for each object, create a node interaction data handler
					const interactionSettings = { select: false, hover: draggingProps.hover, drag: true, dragOrigin: object.dragOrigin, dragAnchors: object.dragAnchors };
					nodeInteractionDataHandlers.push(
						<NodeInteractionDataHandler
							key={`${sessionId}-${outputId}-${componentId}-${JSON.stringify(object)}`}
							sessionId={sessionId}
							componentId={componentId}
							outputIdOrName={outputId}
							patterns={pattern}
							interactionSettings={interactionSettings}
							strictNaming={strictNaming}
						/>
					);
				}
				)
			)
		);

		setNodeInteractionDataHandles(nodeInteractionDataHandlers);

	}, [objects, componentId, draggingProps]);

	/**
	 * Restore the dragged nodes.
	 * First, reset all nodes that are currently dragged but were not dragged in the last state.
	 * Then, apply the transformation to all nodes that were dragged in the last state but are not dragged in the current state.
	 * 
	 * @param lastDraggedNodes The last dragged nodes. This is the state that we want to restore.
	 * @param currentDraggedNodes The current dragged nodes.
	 */
	const restoreDraggedNodes = useCallback((lastDraggedNodes: DraggingParameterValue["objects"] | undefined, currentDraggedNodes: DraggingParameterValue["objects"]) => {
		// reset all nodes that are currently dragged but were not dragged in the last state
		for(const draggedNode of currentDraggedNodes) {
			if(!lastDraggedNodes || !lastDraggedNodes.find(n => n.name === draggedNode.name)) {
				getNodesByName(sessionApis, [draggedNode.name]).forEach(nodesAndNames => {
					if(nodesAndNames.node.transformations.find(t => t.id === "SD_drag_matrix")){
						nodesAndNames.node.transformations = nodesAndNames.node.transformations.filter(t => t.id !== "SD_drag_matrix");
						nodesAndNames.node.updateVersion();
					}
				});
			}
		}

		// apply the transformation to all nodes that were dragged in the last state
		for(const draggedNode of lastDraggedNodes ?? []) {
			getNodesByName(sessionApis, [draggedNode.name]).forEach(nodesAndNames => {
				const transformation = nodesAndNames.node.transformations.find(t => t.id === "SD_drag_matrix");
				const transformationMatrix = mat4.fromValues(...(draggedNode.transformation as [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]));
				
				if (transformation) {
					transformation.matrix = transformationMatrix;
				} else {
					const newTransformation = {
						id: "SD_drag_matrix",
						matrix: transformationMatrix
					};
					nodesAndNames.node.transformations.push(newTransformation);
				}
				nodesAndNames.node.updateVersion();
			});
		}
	}, [sessionApis]);


	return {
		draggedNodes,
		setDraggedNodes,
		resetDraggedNodes,
		handlers: nodeInteractionDataHandlers.concat(handlers),
		restoreDraggedNodes
	};
}

