import {useViewportCanvas} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportCanvas";
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
 * This hook provides the canvas element and manages global pointer events
 * when the camera is active in the viewport.
 *
 * It observes the portalRef for size changes to ensure the viewport is re-rendered
 * when the size changes, which is necessary for the update function to be called.
 *
 * It also adds event listeners for camera start and end events
 * to manage the allowPointerEventsGlobal state,
 * which determines whether global pointer events are allowed
 * or not during camera interactions.
 *
 * @param viewportId The ID of the viewport.
 * @param portalRef The reference to the portal element.
 * @returns An object containing the canvas element and the global pointer events state.
 */
export function useCanvasPortalUtilities(
	viewportId: string,
	portalRef: React.RefObject<HTMLDivElement>,
	portalUpdate: number,
): {
	canvas: HTMLCanvasElement | null;
	allowPointerEventsGlobal: boolean;
} {
	const viewport = useShapeDiverStoreViewport(
		(state) => state.viewports[viewportId],
	);
	const [allowPointerEventsGlobal, setAllowPointerEventsGlobal] =
		useState<boolean>(true);
	const {canvas} = useViewportCanvas(viewportId);

	/**
	 * This effect updates the canvas reference when the viewport changes.
	 * It also adds event listeners for camera start and end events
	 * to manage the allowPointerEventsGlobal state.
	 */
	useEffect(() => {
		const tokenStart = addListener(
			EVENTTYPE_CAMERA.CAMERA_START,
			(e: IEvent) => {
				const cameraEvent =
					e as EventResponseMapping[EVENTTYPE_CAMERA.CAMERA_START];
				if (cameraEvent.viewportId !== viewport.id) return;
				setAllowPointerEventsGlobal(false);
			},
		);

		return () => {
			removeListener(tokenStart);
		};
	}, [viewport]);

	/**
	 * This effect adds event listeners for pointer end events
	 * when the allowPointerEventsGlobal state is false.
	 * It ensures that global pointer events are only allowed
	 * when the camera is not active in the viewport.
	 */
	useEffect(() => {
		const pointerEndEvent = () => {
			// Only update state if currently disabled
			setAllowPointerEventsGlobal((prev) => (prev ? prev : true));
		};

		window.addEventListener("pointerup", pointerEndEvent);
		window.addEventListener("pointercancel", pointerEndEvent);

		return () => {
			window.removeEventListener("pointerup", pointerEndEvent);
			window.removeEventListener("pointercancel", pointerEndEvent);
		};
	}, []);

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
	}, [viewport, portalUpdate]);

	return {canvas, allowPointerEventsGlobal};
}
