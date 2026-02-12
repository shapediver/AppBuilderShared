import {ViewportControlsVisibilityContext} from "@AppBuilderLib/shared/lib";
import {useContext} from "react";

export function useViewportControls() {
	const context = useContext(ViewportControlsVisibilityContext);

	return context;
}
