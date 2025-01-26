import { useDrawingOptionsStore } from "@AppBuilderShared/store/useDrawingOptionsStore";
import { useShapeDiverStoreViewport } from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import { createDrawingTools, GeometryRestrictionApi, IDrawingToolsApi, PlaneRestrictionApi, PointsData, Settings } from "@shapediver/viewer.features.drawing-tools";
import { useEffect, useState } from "react";

// #region Variables (1)

// define the drawing tools APIs for the viewports
const drawingToolsApis: {
	[key: string]: IDrawingToolsApi
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
	onCancel: () => void
): IDrawingToolsApi | undefined {
	// get the drawing tools options from the store
	const { showPointLabels, showDistanceLabels, gridSize, angleStep, snapToVertices, snapToEdges, snapToFaces } = useDrawingOptionsStore();

	// get the viewport API
	const viewportApi = useShapeDiverStoreViewport(state => { return state.viewports[viewportId]; });
	// state for the drawing tools API
	const [drawingToolsApi, setDrawingToolsApi] = useState<IDrawingToolsApi | undefined>(undefined);

	useEffect(() => {
		if (viewportApi && drawingToolsSettings && !drawingToolsApis[viewportId]) {
			const drawingToolsApi = createDrawingTools(viewportApi, { onUpdate, onCancel }, drawingToolsSettings);

			// set the drawing tools options from the store
			drawingToolsApi.showPointLabels = showPointLabels;
			drawingToolsApi.showDistanceLabels = showDistanceLabels;
			Object.values(drawingToolsApi.restrictions).filter(r => r instanceof PlaneRestrictionApi).forEach(p => p.gridRestrictionApi.gridUnit = gridSize);
			Object.values(drawingToolsApi.restrictions).filter(r => r instanceof PlaneRestrictionApi).forEach(p => p.angularRestrictionApi.angleStep = Math.PI / angleStep);
			Object.values(drawingToolsApi.restrictions).filter(r => r instanceof GeometryRestrictionApi).forEach(p => p.snapToVertices = snapToVertices);
			Object.values(drawingToolsApi.restrictions).filter(r => r instanceof GeometryRestrictionApi).forEach(p => p.snapToEdges = snapToEdges);
			Object.values(drawingToolsApi.restrictions).filter(r => r instanceof GeometryRestrictionApi).forEach(p => p.snapToFaces = snapToFaces);

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
