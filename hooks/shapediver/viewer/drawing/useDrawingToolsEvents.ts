import { addListener, EVENTTYPE_DRAWING_TOOLS, IEvent, removeListener } from "@shapediver/viewer.session";
import { DrawingToolsEventResponseMapping, PointsData } from "@shapediver/viewer.features.drawing-tools";
import { useContext, useEffect, useState } from "react";
import { NotificationContext } from "@AppBuilderShared/context/NotificationContext";

// #region Functions (1)

/**
 * Hook allowing to create the drawing tools events.
 *
 * @param viewportId The ID of the viewport.
 */
export function useDrawingToolsEvents(
	viewportId: string,
	initialPointsData?: PointsData
): {
	/**
	 * The points data.
	 */
	pointsData?: PointsData,
	/**
	 * The function to set the points data.
	 *
	 * @param pointsData The points data.
	 */
	setPointsData: (pointsData: PointsData) => void,
} {
	// state for the points data
	const [pointsData, setPointsData] = useState<PointsData | undefined>(initialPointsData);

	// get the notification context
	const notifications = useContext(NotificationContext);

	// register an event handler and listen for updates
	useEffect(() => {
		/**
		 * Event handler for the minimum points event.
		 * In this event handler, a notification is shown.
		 */
		const tokenDrawingToolsMinimumPoints = addListener(EVENTTYPE_DRAWING_TOOLS.MINIMUM_POINTS, async (event: IEvent) => {
			const drawingToolsEvent = event as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.MINIMUM_POINTS];

			// If the event is not based on the viewport ID, we ignore it.
			if (drawingToolsEvent.viewportId !== viewportId) return;

			notifications.warning({
				title: "The minimum number of points is not reached.",
				message: drawingToolsEvent.message,
			});
		});

		/**
		 * Event handler for the maximum points event.
		 * In this event handler, a notification is shown.
		 */
		const tokenDrawingToolsMaximumPoints = addListener(EVENTTYPE_DRAWING_TOOLS.MAXIMUM_POINTS, async (event: IEvent) => {
			const drawingToolsEvent = event as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.MAXIMUM_POINTS];

			// If the event is not based on the viewport ID, we ignore it.
			if (drawingToolsEvent.viewportId !== viewportId) return;

			notifications.warning({
				title: "The maximum number of points is reached.",
				message: drawingToolsEvent.message,
			});
		});

		const tokenDrawingToolsGeometryChanged = addListener(EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED, (e: IEvent) => {
			const drawingToolsEvent = e as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED];

			// If the event is not based on the viewport ID, we ignore it.
			if (drawingToolsEvent.viewportId !== viewportId) return;

			// If the event is not temporary and the points are defined, we set the points data
			if (drawingToolsEvent.temporary === false && drawingToolsEvent.points !== undefined && drawingToolsEvent.recordHistory !== false) {
				setPointsData(drawingToolsEvent.points);
			}
		});

		/**
		 * Remove the event listeners when the component is unmounted.
		 */
		return () => {
			removeListener(tokenDrawingToolsMinimumPoints);
			removeListener(tokenDrawingToolsMaximumPoints);
			removeListener(tokenDrawingToolsGeometryChanged);
		};
	}, []);

	return {
		pointsData,
		setPointsData,
	};
}

// #endregion Functions (1)
