import {useViewportCanvas} from "@AppBuilderLib/entities/viewport/model/useViewportCanvas";
import {useEffect} from "react";
import {automaticSceneUpdateScheduler} from "./automaticSceneUpdateScheduler";

/**
 * Pause the countdown of the automatic scene updates while a pointer is
 * pressed in the viewport (see `AutomaticSceneUpdateScheduler.holdPointer`):
 * a new move, e.g. of another object controlled by another parameter, must
 * not be interrupted by the update of an earlier move. The countdown restarts
 * with the full timeout once the pointer is released.
 *
 * Several components may register for the same viewport, the scheduler
 * tracks the pressed pointers by id. The scheduler observes the release
 * itself: the press may unmount the component (e.g. a click into the scene
 * closes the container of the parameter).
 *
 * @param viewportId The viewport whose canvas is observed.
 * @param enabled Whether the component uses automatic scene updates.
 */
export function useAutomaticSceneUpdatePointerHold(
	viewportId: string,
	enabled: boolean,
): void {
	const {canvas} = useViewportCanvas(viewportId);

	useEffect(() => {
		if (!enabled || !canvas) return;
		const onPointerDown = (event: PointerEvent) =>
			automaticSceneUpdateScheduler.holdPointer(event.pointerId);

		canvas.addEventListener("pointerdown", onPointerDown, {capture: true});
		return () =>
			canvas.removeEventListener("pointerdown", onPointerDown, {
				capture: true,
			});
	}, [canvas, enabled]);
}
