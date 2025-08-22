import {ViewportControlsVisibilityContext} from "@AppBuilderShared/context/ViewportControlsVisibilityContext";
import {useContext} from "react";

export function useViewportControls() {
	const context = useContext(ViewportControlsVisibilityContext);

	return context;
}
