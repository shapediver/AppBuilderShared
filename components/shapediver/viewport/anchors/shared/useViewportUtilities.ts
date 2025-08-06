import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {
	addListener,
	EventResponseMapping,
	EVENTTYPE_CAMERA,
	IEvent,
	removeListener,
} from "@shapediver/viewer.session";
import {useEffect, useState} from "react";

/**
 * Hook to manage the viewport canvas portal.
 *
 * @param viewportId The ID of the viewport.
 * @param portalRef The reference to the portal element.
 * @returns An object containing the canvas element and the global pointer events state.
 */
export function useViewportCanvasPortal(
	viewportId: string,
	portalRef: React.RefObject<HTMLDivElement>,
): {
	canvas: HTMLCanvasElement | null;
	allowPointerEventsGlobal: boolean;
} {
	const viewport = useShapeDiverStoreViewport(
		(state) => state.viewports[viewportId],
	);
	const [allowPointerEventsGlobal, setAllowPointerEventsGlobal] =
		useState<boolean>(true);
	const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

	/**
	 * This effect updates the canvas reference when the viewport changes.
	 * It also adds event listeners for camera start and end events
	 * to manage the allowPointerEventsGlobal state.
	 */
	useEffect(() => {
		if (viewport?.canvas) setCanvas(viewport.canvas);

		const tokenStart = addListener(
			EVENTTYPE_CAMERA.CAMERA_START,
			(e: IEvent) => {
				const cameraEvent =
					e as EventResponseMapping[EVENTTYPE_CAMERA.CAMERA_START];
				if (cameraEvent.viewportId !== viewport.id) return;
				setAllowPointerEventsGlobal(false);
			},
		);

		const tokenEnd = addListener(
			EVENTTYPE_CAMERA.CAMERA_END,
			(e: IEvent) => {
				const cameraEvent =
					e as EventResponseMapping[EVENTTYPE_CAMERA.CAMERA_END];
				if (cameraEvent.viewportId !== viewport.id) return;
				setAllowPointerEventsGlobal(true);
			},
		);

		return () => {
			removeListener(tokenStart);
			removeListener(tokenEnd);
		};
	}, [viewport]);

	/**
	 * We need to observe the portalRef for changes in size
	 * to ensure that the viewport is re-rendered when the size changes.
	 * This is necessary because only then the update function will be called
	 * and the position of the portal will be updated accordingly.
	 */
	useEffect(() => {
		if (!portalRef.current) return;
		const observer = new ResizeObserver(() => {
			viewport?.render();
		});
		observer.observe(portalRef.current);

		return () => observer.disconnect();
	}, [portalRef.current, viewport]);

	return {canvas, allowPointerEventsGlobal};
}
