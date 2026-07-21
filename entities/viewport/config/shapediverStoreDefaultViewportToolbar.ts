import {IViewportApi} from "@shapediver/viewer.viewport";

export enum DefaultViewportToolbarButtonEnum {
	Ar = "ar",
	Zoom = "zoom",
	Fullscreen = "fullscreen",
	Fullscreen3States = "fullscreen3States",
	Cameras = "cameras",
	Undo = "undo",
	Redo = "redo",
	Reload = "reload",
	HistoryMenu = "historyMenu",
}

export interface DefaultViewportToolbarButton {
	type: DefaultViewportToolbarButtonEnum;
	data?: Record<string, any>;
}

export enum DefaultViewportToolbarLayoutItemEnum {
	Button = "button",
	Group = "group",
}

export type DefaultViewportToolbarLayoutItem =
	| {
			type: DefaultViewportToolbarLayoutItemEnum.Button;
			button: DefaultViewportToolbarButton;
	  }
	| {
			type: DefaultViewportToolbarLayoutItemEnum.Group;
			sections: DefaultViewportToolbarButton[][];
	  };

export interface DefaultViewportToolbarViewportState {
	layout: DefaultViewportToolbarLayoutItem[];
}

export type DefaultViewportToolbarStateByViewport = Record<
	string,
	DefaultViewportToolbarViewportState
>;

export interface IShapeDiverDefaultViewportToolbarStore {
	defaultViewportToolbars: DefaultViewportToolbarStateByViewport;
	/**
	 * Whether the viewer is in fullscreen mode (UI elements hidden).
	 * When true, ViewportComponent covers the entire screen.
	 */
	viewerFullscreen3States: boolean;
	/**
	 * Set the viewer fullscreen state.
	 * @param value - true to enable viewer fullscreen, false to disable
	 */
	setViewerFullscreen3States: (value: boolean) => void;
	/**
	 * Initialize the default viewport toolbar store for a viewport.
	 * @param viewportId
	 */
	initialize: (viewport: IViewportApi) => void;
	// Add button or group (array => group). Optional index; append if omitted/invalid.
	add: (
		viewportId: string,
		input: DefaultViewportToolbarButton | DefaultViewportToolbarButton[],
		index?: number,
	) => void;

	// remove by index (no-op if out of range)
	remove: (viewportId: string, index: number) => void;

	// clear all icons for a viewport
	clear: (viewportId: string) => void;
}
