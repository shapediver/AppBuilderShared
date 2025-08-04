import {createContext} from "react";

export interface ViewportControlsVisibilityContextType {
	showControls: boolean;
	setIsHoveringControls: (isHoveringControls: boolean) => void;
}

export const ViewportControlsVisibilityContext =
	createContext<ViewportControlsVisibilityContextType>({
		showControls: true,
		setIsHoveringControls: () => {},
	});
