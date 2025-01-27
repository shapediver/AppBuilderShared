import {ViewportContext} from "@AppBuilderShared/context/ViewportContext";
import {useContext} from "react";

/**
 * Hook for getting the id of the main viewport used by the application.
 * (Viewport of the ShapeDiver 3D Viewer).
 *
 * @returns
 */
export function useViewportId() {
	const {viewportId} = useContext(ViewportContext);

	return {
		viewportId,
	};
}
