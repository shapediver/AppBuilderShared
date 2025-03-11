import {useInteractionEngine} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/useInteractionEngine";
import {
	InteractionEngine,
	MultiSelectManager,
	SelectManager,
} from "@shapediver/viewer.features.interaction";
import {
	ISelectionParameterProps,
	MaterialStandardData,
} from "@shapediver/viewer.session";
import {useEffect, useState} from "react";

// #region Functions (1)

// create an object to store the hover managers for each component that is assigned to a viewport
const selectManagers: {
	[key: string]: {
		[key: string]: {
			selectManager: SelectManager | MultiSelectManager;
			selectMultiple: boolean;
			token: string;
		};
	};
} = {};

/**
 * Clean up the select manager for the given viewportId and componentId.
 * We also deselect all selected nodes.
 *
 * @param viewportId - The ID of the viewport.
 * @param componentId - The ID of the component.
 * @param interactionEngine - The interaction engine instance.
 */
const cleanUpSelectManager = (
	viewportId: string,
	componentId: string,
	interactionEngine?: InteractionEngine,
) => {
	if (selectManagers[viewportId][componentId]) {
		if (
			selectManagers[viewportId][componentId].selectManager instanceof
			SelectManager
		) {
			(
				selectManagers[viewportId][componentId]
					.selectManager as SelectManager
			).deselect();
		} else if (
			selectManagers[viewportId][componentId].selectManager instanceof
			MultiSelectManager
		) {
			(
				selectManagers[viewportId][componentId]
					.selectManager as MultiSelectManager
			).deselectAll();
		}
		if (interactionEngine && interactionEngine.closed === false)
			interactionEngine.removeInteractionManager(
				selectManagers[viewportId][componentId].token,
			);
		delete selectManagers[viewportId][componentId];
	}
};

/**
 * Hook providing select managers for viewports.
 * Use the useNodeInteractionData hook to add interaction data to nodes of the
 * scene tree and make them selectable.
 *
 * @param viewportId The ID of the viewport.
 * @param componentId The ID of the component.
 * @param settings The settings for the select manager. If the settings are not provided, the select manager will not be created.
 */
export function useSelectManager(
	viewportId: string,
	componentId: string,
	settings?: Pick<
		ISelectionParameterProps,
		"minimumSelection" | "maximumSelection" | "selectionColor"
	>,
): {
	/**
	 * The select manager that was created for the viewport.
	 * Depending on the settings, this can be a select manager or a multi select manager.
	 */
	selectManager?: SelectManager | MultiSelectManager;
} {
	// call the interaction engine hook
	const {interactionEngine} = useInteractionEngine(viewportId);

	// create an empty object for the select managers of the viewport
	if (!selectManagers[viewportId]) {
		selectManagers[viewportId] = {};
	}

	// define a state for the select manager
	const [selectManager, setSelectManager] = useState<
		SelectManager | MultiSelectManager | undefined
	>(undefined);

	// use an effect to create the select manager
	useEffect(() => {
		if (settings) {
			let changed = false;

			// whenever this output node changes, we want to create the interaction engine
			const selectMultiple =
				settings.minimumSelection !== undefined &&
				settings.maximumSelection !== undefined &&
				settings.minimumSelection <= settings.maximumSelection &&
				settings.maximumSelection > 1;

			// check if a select manager already exists for the viewport and component, but with different settings
			// in this case we need to remove the old select manager and create a new one
			if (
				selectManagers[viewportId][componentId] &&
				selectManagers[viewportId][componentId].selectMultiple !==
					selectMultiple
			) {
				cleanUpSelectManager(
					viewportId,
					componentId,
					interactionEngine,
				);
				changed = true;
			}

			if (interactionEngine && interactionEngine.closed === false) {
				changed = true;
				// depending on the settings, create a select manager or a multi select manager
				if (selectMultiple) {
					// create a multi select manager with the given settings
					const selectManager = new MultiSelectManager(
						componentId,
						new MaterialStandardData({
							color: settings.selectionColor || "#0d44f0",
						}),
						settings.minimumSelection!,
						settings.maximumSelection!,
					);
					selectManager.deselectOnEmpty = false;

					const token =
						interactionEngine.addInteractionManager(selectManager);
					selectManagers[viewportId][componentId] = {
						selectManager,
						token,
						selectMultiple,
					};
				} else {
					// create a select manager with the given settings
					const selectManager = new SelectManager(
						componentId,
						new MaterialStandardData({
							color: settings.selectionColor || "#0d44f0",
						}),
					);
					selectManager.deselectOnEmpty = false;

					const token =
						interactionEngine.addInteractionManager(selectManager);
					selectManagers[viewportId][componentId] = {
						selectManager,
						token,
						selectMultiple,
					};
				}
			}

			if (changed) {
				setSelectManager(
					selectManagers[viewportId][componentId].selectManager,
				);
			}
		}

		return () => {
			// clean up the select manager
			if (selectManagers[viewportId][componentId]) {
				cleanUpSelectManager(
					viewportId,
					componentId,
					interactionEngine,
				);
				setSelectManager(undefined);
			}
		};
	}, [interactionEngine, settings]);

	return {
		selectManager,
	};
}

// #endregion Functions (1)
