import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {useEffect, useState} from "react";

/**
 * Hook to get the viewport canvas
 *
 * @param viewportId The ID of the viewport.
 * @returns An object containing the canvas element.
 */
export function useViewportCanvas(viewportId: string): {
	canvas: HTMLCanvasElement | null;
} {
	const viewport = useShapeDiverStoreViewport(
		(state) => state.viewports[viewportId],
	);
	const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

	/**
	 * This effect updates the canvas reference when the viewport changes.
	 */
	useEffect(() => {
		if (viewport?.canvas) setCanvas(viewport.canvas);
	}, [viewport]);

	return {canvas};
}
