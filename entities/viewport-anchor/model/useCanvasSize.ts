import {useEffect, useState} from "react";

/**
 * Size of the box App Builder overlays are positioned in.
 *
 * That box is the canvas parent, the same element toolbars fill with
 * `inset: 0`. A screenshot can set the canvas element's own CSS size to
 * the requested resolution while the parent stays put. Following the canvas
 * would move anchors for the duration of the shot.
 *
 * @param canvas The viewport canvas. Its parent is observed.
 * @returns The width and height of the overlay box.
 */
export function useCanvasSize(canvas?: HTMLCanvasElement | null): {
	width: number;
	height: number;
} {
	const [canvasSize, setCanvasSize] = useState<{
		width: number;
		height: number;
	}>({
		width: 0,
		height: 0,
	});

	useEffect(() => {
		if (!canvas) return;
		const target = canvas.parentElement ?? canvas;
		const readSize = () => ({
			width: target.clientWidth,
			height: target.clientHeight,
		});
		const observer = new ResizeObserver(() => {
			setCanvasSize(readSize());
		});
		observer.observe(target);
		setCanvasSize(readSize());

		return () => observer.disconnect();
	}, [canvas]);

	return {width: canvasSize.width, height: canvasSize.height};
}
