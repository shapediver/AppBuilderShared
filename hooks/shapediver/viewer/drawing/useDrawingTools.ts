import {useDrawingToolsApi} from "@AppBuilderShared/hooks/shapediver/viewer/drawing/useDrawingToolsApi";
import {useDrawingToolsEvents} from "@AppBuilderShared/hooks/shapediver/viewer/drawing/useDrawingToolsEvents";
import {useRestrictions} from "@AppBuilderShared/hooks/shapediver/viewer/drawing/useRestrictions";
import {
	IDrawingToolsApi,
	PointsData,
	Settings,
} from "@shapediver/viewer.features.drawing-tools";
import {IDrawingParameterSettings} from "@shapediver/viewer.session";
import {useCallback, useEffect, useMemo, useRef} from "react";

// #region Functions (1)

/**
 * Hook allowing to use the drawing tools.
 *
 * @param viewportId The ID of the viewport.
 * @param drawingParameterProps The properties of the drawing parameter.
 * @param onUpdateComponent The callback function for the update event.
 * @param onCancelComponent The callback function for the cancel event.
 * @param activate The activation state of the drawing tools.
 * @param initialPointsData The initial points data.
 * @returns
 */
export function useDrawingTools(
	viewportId: string,
	drawingParameterProps: IDrawingParameterSettings,
	onUpdateComponent: (pointsData: PointsData) => void,
	onCancelComponent: () => void,
	activate: boolean,
	initialPointsData?: PointsData,
): {
	/**
	 * The drawing tools API.
	 */
	drawingToolsApi?: IDrawingToolsApi;
	/**
	 * The points data.
	 */
	pointsData?: PointsData;
	/**
	 * The function to set the points data.
	 *
	 * @param pointsData The points data.
	 */
	setPointsData: (pointsData: PointsData) => void;
	/**
	 * The handlers to be added to the document.
	 */
	handlers: JSX.Element[];
} {
	// use the drawing tools events
	const {pointsData, setPointsData} = useDrawingToolsEvents(
		viewportId,
		initialPointsData,
	);

	// use the restrictions
	const {restrictions, handlers} = useRestrictions(
		drawingParameterProps.restrictions,
	);

	// set the drawing tools settings
	const drawingToolsSettings: Partial<Settings> = useMemo(() => {
		return {
			geometry: {
				points: initialPointsData || [],
				...drawingParameterProps?.geometry,
			},
			restrictions,
		};
	}, [drawingParameterProps, initialPointsData, restrictions]);

	// reference for the drawing tools API
	const drawingToolsApiRef = useRef<IDrawingToolsApi | undefined>(undefined);

	// extend the onCancel callback to close the drawing tools
	const onCancel = useCallback(() => {
		if (drawingToolsApiRef.current) drawingToolsApiRef.current.close();
		onCancelComponent();
	}, [onCancelComponent]);

	// use the drawing tools API
	const drawingToolsApi = useDrawingToolsApi(
		viewportId,
		activate ? drawingToolsSettings : undefined,
		onUpdateComponent,
		onCancel,
	);

	useEffect(() => {
		drawingToolsApiRef.current = drawingToolsApi;
	}, [drawingToolsApi]);

	return {
		drawingToolsApi: drawingToolsApi,
		pointsData: pointsData,
		setPointsData: setPointsData,
		handlers,
	};
}

// #endregion Functions (1)
