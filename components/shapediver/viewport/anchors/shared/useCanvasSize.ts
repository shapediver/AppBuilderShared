import {useEffect, useState} from "react";

/**
 * Hook to get the size of a canvas element.
 * @param canvas The canvas element to observe.
 * @returns The width and height of the canvas.
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

	/**
	 * This effect observes the canvas for size changes and updates the canvasWidth and canvasHeight state.
	 * It also sets the initial size of the canvas.
	 */
	useEffect(() => {
		if (!canvas) return;
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const {width, height} = entry.contentRect;
				setCanvasSize({
					width,
					height,
				});
			}
		});
		observer.observe(canvas);

		// Set initial size
		setCanvasSize({
			width: canvas.offsetWidth,
			height: canvas.offsetHeight,
		});

		return () => observer.disconnect();
	}, [canvas]);

	return {width: canvasSize.width, height: canvasSize.height};
}
