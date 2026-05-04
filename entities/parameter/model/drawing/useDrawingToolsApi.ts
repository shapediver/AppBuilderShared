import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport";
import {
	createDrawingTools,
	IDrawingToolsApi,
	PointsData,
	Settings,
} from "@shapediver/viewer.features.drawing-tools";
import {useEffect, useState} from "react";
import {useDrawingOptionsStore} from "./useDrawingOptionsStore";

// #region Variables (1)

// define the drawing tools APIs for the viewports
const drawingToolsApis: {
	[key: string]: IDrawingToolsApi;
} = {};

// #endregion Variables (1)

// #region Functions (1)

/**
 * Hook allowing to create the drawing tools API.
 *
 * @param viewportId The ID of the viewport.
 * @param drawingToolsSettings The settings for the drawing tools.
 * @param onUpdate The callback function for the update event.
 * @param onCancel The callback function for the cancel event.
 * @returns
 */
export function useDrawingToolsApi(
	viewportId: string,
	drawingToolsSettings: Partial<Settings> | undefined,
	onUpdate: (pointsData: PointsData) => void,
	onCancel: () => void,
): IDrawingToolsApi | undefined {
	// get the drawing tools options from the store
	const {
		showPointLabels,
		setShowPointLabels,
		showDistanceLabels,
		setShowDistanceLabels,
	} = useDrawingOptionsStore();

	// get the viewport API
	const viewportApi = useShapeDiverStoreViewport((state) => {
		return state.viewports[viewportId];
	});
	// state for the drawing tools API
	const [drawingToolsApi, setDrawingToolsApi] = useState<
		IDrawingToolsApi | undefined
	>(undefined);

	useEffect(() => {
		if (
			viewportApi &&
			drawingToolsSettings &&
			!drawingToolsApis[viewportId]
		) {
			const drawingToolsApi = createDrawingTools(
				viewportApi,
				{onUpdate, onCancel},
				drawingToolsSettings,
			);

			/**
			 * The following code is used to update the drawing tools options or update the drawing tools themselves.
			 * If there are settings provided, the drawing tools options are updated.
			 * If there are no settings provided, the drawing tools options are set from the store.
			 */

			if (drawingToolsSettings.visualization?.pointLabels !== undefined) {
				// update the store with the drawing tools options (the drawing tools are already updated correctly)
				setShowPointLabels(
					drawingToolsSettings.visualization?.pointLabels,
				);
			} else {
				// set the drawing tools options from the store
				drawingToolsApi.showPointLabels = showPointLabels;
			}

			if (
				drawingToolsSettings.visualization?.distanceLabels !== undefined
			) {
				// update the store with the drawing tools options (the drawing tools are already updated correctly)
				setShowDistanceLabels(
					drawingToolsSettings.visualization?.distanceLabels,
				);
			} else {
				// set the drawing tools options from the store
				drawingToolsApi.showDistanceLabels = showDistanceLabels;
			}

			drawingToolsApis[viewportId] = drawingToolsApi;
			setDrawingToolsApi(drawingToolsApi);
		}

		return () => {
			// clean up the drawing tools
			if (drawingToolsApis[viewportId]) {
				drawingToolsApis[viewportId].close();
				delete drawingToolsApis[viewportId];
				setDrawingToolsApi(undefined);
			}
		};
	}, [viewportApi, drawingToolsSettings, onUpdate, onCancel]);

	return drawingToolsApi;
}

// #endregion Functions (1)
