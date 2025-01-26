import { IDraggingParameterProps, MaterialStandardData } from "@shapediver/viewer.session";
import { DragManager, InteractionEngine } from "@shapediver/viewer.features.interaction";
import { useEffect, useState } from "react";
import { useInteractionEngine } from "@AppBuilderShared/hooks/shapediver/viewer/interaction/useInteractionEngine";

// #region Functions (1)

// create an object to store the drag managers for each component that is assigned to a viewport
const dragManagers: {
	[key: string]: {
		[key: string]: {
			dragManager: DragManager,
			token: string
		}
	}
} = {};

/**
 * Clean up the drag manager for the given viewportId and componentId.
 *
 * @param viewportId - The ID of the viewport.
 * @param componentId - The ID of the component.
 * @param interactionEngine - The interaction engine instance.
 */
const cleanUpDragManager = (viewportId: string, componentId: string, interactionEngine?: InteractionEngine) => {
	if (dragManagers[viewportId][componentId]) {
		if (interactionEngine && interactionEngine.closed === false)
			interactionEngine.removeInteractionManager(dragManagers[viewportId][componentId].token);
		delete dragManagers[viewportId][componentId];
	}
};

/**
 * Hook providing drag managers for viewports. 
 * Use the useNodeInteractionData hook to add interaction data to nodes of the
 * scene tree and make them draggable.
 * 
 * @param viewportId The ID of the viewport.
 * @param componentId The ID of the component.
 * @param settings The settings for the drag manager. If the settings are not provided, the drag manager will not be created.
 */
export function useDragManager(viewportId: string, componentId: string, settings?: Pick<IDraggingParameterProps, "draggingColor">): {
	/**
	 * The drag manager that was created for the viewport.
	 */
	dragManager?: DragManager
} {
	// call the interaction engine hook
	const { interactionEngine } = useInteractionEngine(viewportId);

	// create an empty object for the drag managers of the viewport
	if (!dragManagers[viewportId]) {
		dragManagers[viewportId] = {};
	}

	// define a state for the drag manager
	const [dragManager, setDragManager] = useState<DragManager | undefined>(undefined);

	// use an effect to create the drag manager
	useEffect(() => {
		if (settings && interactionEngine && interactionEngine.closed === false && !dragManagers[viewportId][componentId]) {
			// create the drag manager with the given settings
			const dragManager = new DragManager(
				componentId,
				new MaterialStandardData({ color: settings.draggingColor || "#9e27d8" })
			);
			const token = interactionEngine.addInteractionManager(dragManager);
			dragManagers[viewportId][componentId] = { dragManager, token };
			setDragManager(dragManagers[viewportId][componentId].dragManager);
		}

		return () => {
			// clean up the drag manager
			if (dragManagers[viewportId][componentId]) {
				cleanUpDragManager(viewportId, componentId, interactionEngine);
				setDragManager(undefined);
			}
		};
	}, [interactionEngine, settings]);

	return {
		dragManager
	};
}

// #endregion Functions (1)
