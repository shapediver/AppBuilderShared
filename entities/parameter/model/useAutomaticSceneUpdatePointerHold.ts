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
 * tracks the pressed pointers by id.
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
		// the pointer may be released outside of the canvas
		const onPointerUp = (event: PointerEvent) =>
			automaticSceneUpdateScheduler.releasePointer(event.pointerId);
		const onBlur = () => automaticSceneUpdateScheduler.releaseAllPointers();

		canvas.addEventListener("pointerdown", onPointerDown, {capture: true});
		window.addEventListener("pointerup", onPointerUp, {capture: true});
		window.addEventListener("pointercancel", onPointerUp, {capture: true});
		window.addEventListener("blur", onBlur);
		return () => {
			canvas.removeEventListener("pointerdown", onPointerDown, {
				capture: true,
			});
			window.removeEventListener("pointerup", onPointerUp, {
				capture: true,
			});
			window.removeEventListener("pointercancel", onPointerUp, {
				capture: true,
			});
			window.removeEventListener("blur", onBlur);
		};
	}, [canvas, enabled]);
}
