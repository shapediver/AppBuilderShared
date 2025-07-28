import {createContext} from "react";

export interface ViewportControlsVisibilityContextType {
	showControls: boolean;
}

export const ViewportControlsVisibilityContext =
	createContext<ViewportControlsVisibilityContextType>({
		showControls: true,
	});
