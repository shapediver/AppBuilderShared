import {useRestrictions} from "@AppBuilderShared/hooks/shapediver/viewer/drawing/useRestrictions";
import {useDragManager} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/dragging/useDragManager";
import {useDragManagerEvents} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/dragging/useDragManagerEvents";
import {useHoverManager} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/selection/useHoverManager";
import {useConvertDraggingData} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/useConvertDraggingData";
import {
	IUseNodeInteractionDataProps,
	useNodesInteractionData,
} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/useNodeInteractionData";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {getNodesByName} from "@shapediver/viewer.features.interaction";
import {
	DraggingParameterValue,
	IDraggingParameterProps,
} from "@shapediver/viewer.session";
import {mat4} from "gl-matrix";
import {useCallback, useId, useMemo} from "react";

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
	strictNaming = true,
): {
	/**
	 * The dragged nodes.
	 */
	draggedNodes: DraggingParameterValue["objects"];
	/**
	 * Set the dragged nodes.
	 */
	setDraggedNodes: (nodes: DraggingParameterValue["objects"]) => void;
	/**
	 * Reset the dragged nodes.
	 */
	resetDraggedNodes: () => void;
	/**
	 * Restore the dragged nodes to a previous state.
	 */
	restoreDraggedNodes: (
		lastDraggedNodes: DraggingParameterValue["objects"] | undefined,
		currentDraggedNodes: DraggingParameterValue["objects"],
	) => void;
} {
	// get the session API
	const sessionApis = useShapeDiverStoreSession((state) => {
		return sessionIds.map((id) => state.sessions[id]);
	});
	// create a unique component ID
	const componentId = useId();

	// use the restrictions
	const {restrictions} = useRestrictions(draggingProps.restrictions);

	// call the drag manager hook
	useDragManager(
		viewportId,
		componentId,
		activate ? draggingProps : undefined,
	);

	// convert the dragging data
	const {objects} = useConvertDraggingData(sessionIds, draggingProps);

	// call the hover manager hook
	const hoverSettings = useMemo(() => {
		return {hoverColor: draggingProps.hoverColor};
	}, [draggingProps]);
	useHoverManager(
		viewportId,
		componentId,
		activate ? hoverSettings : undefined,
	);

	// call the drag manager events hook
	const {draggedNodes, setDraggedNodes, resetDraggedNodes} =
		useDragManagerEvents(
			objects,
			restrictions,
			componentId,
			initialDraggedNodes,
			strictNaming,
		);

	/**
	 * Memo to create the nodes interaction input.
	 * This is used to update the interaction data for the dragged nodes.
	 */
	const nodesInteractionInput = useMemo(() => {
		const nodesInteractionInput: {
			[key: string]: IUseNodeInteractionDataProps;
		} = {};

		objects.forEach((object, index) =>
			Object.entries(object.patterns).forEach(
				([sessionId, sessionData]) =>
					Object.entries(sessionData).forEach(
						([outputId, pattern]) => {
							// create the interaction data
							// here the key doesn't matter much as we don't need the data later
							// but it must be unique to avoid conflicts
							nodesInteractionInput[
								`object${index}_${sessionId}_${outputId}`
							] = {
								sessionId,
								componentId,
								outputId,
								patterns: pattern,
								interactionSettings: {
									select: false,
									hover: draggingProps.hover,
									drag: true,
									dragOrigin: object.dragOrigin,
									dragAnchors: object.dragAnchors,
								},
								strictNaming,
							};
						},
					),
			),
		);

		return nodesInteractionInput;
	}, [objects, componentId, draggingProps]);

	// call the node interaction data hook
	useNodesInteractionData(nodesInteractionInput);

	/**
	 * Restore the dragged nodes.
	 * First, reset all nodes that are currently dragged but were not dragged in the last state.
	 * Then, apply the transformation to all nodes that were dragged in the last state but are not dragged in the current state.
	 *
	 * @param lastDraggedNodes The last dragged nodes. This is the state that we want to restore.
	 * @param currentDraggedNodes The current dragged nodes.
	 */
	const restoreDraggedNodes = useCallback(
		(
			lastDraggedNodes: DraggingParameterValue["objects"] | undefined,
			currentDraggedNodes: DraggingParameterValue["objects"],
		) => {
			// reset all nodes that are currently dragged but were not dragged in the last state
			for (const draggedNode of currentDraggedNodes) {
				if (
					!lastDraggedNodes ||
					!lastDraggedNodes.find((n) => n.name === draggedNode.name)
				) {
					getNodesByName(sessionApis, [draggedNode.name]).forEach(
						(nodesAndNames) => {
							if (
								nodesAndNames.node.transformations.find(
									(t) => t.id === "SD_drag_matrix",
								)
							) {
								nodesAndNames.node.transformations =
									nodesAndNames.node.transformations.filter(
										(t) => t.id !== "SD_drag_matrix",
									);
								nodesAndNames.node.updateVersion();
							}
						},
					);
				}
			}

			// apply the transformation to all nodes that were dragged in the last state
			for (const draggedNode of lastDraggedNodes ?? []) {
				getNodesByName(sessionApis, [draggedNode.name]).forEach(
					(nodesAndNames) => {
						const transformation =
							nodesAndNames.node.transformations.find(
								(t) => t.id === "SD_drag_matrix",
							);
						const transformationMatrix = mat4.fromValues(
							...(draggedNode.transformation as [
								number,
								number,
								number,
								number,
								number,
								number,
								number,
								number,
								number,
								number,
								number,
								number,
								number,
								number,
								number,
								number,
							]),
						);

						if (transformation) {
							transformation.matrix = transformationMatrix;
						} else {
							const newTransformation = {
								id: "SD_drag_matrix",
								matrix: transformationMatrix,
							};
							nodesAndNames.node.transformations.push(
								newTransformation,
							);
						}
						nodesAndNames.node.updateVersion();
					},
				);
			}
		},
		[sessionApis],
	);

	return {
		draggedNodes,
		setDraggedNodes,
		resetDraggedNodes,
		restoreDraggedNodes,
	};
}
