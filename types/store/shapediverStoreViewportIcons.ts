export enum ViewportIconButtonType {
	Ar = "ar",
	Zoom = "zoom",
	Fullscreen = "fullscreen",
	Cameras = "cameras",
	Undo = "undo",
	Redo = "redo",
	HistoryMenu = "historyMenu",
}

export interface ViewportIconButtonDef {
	type: ViewportIconButtonType;
	data?: Record<string, any>;
}

export enum ViewportIconLayoutItemType {
	Button = "button",
	Group = "group",
}

export type ViewportIconLayoutItem =
	| {type: ViewportIconLayoutItemType.Button; button: ViewportIconButtonDef}
	| {
			type: ViewportIconLayoutItemType.Group;
			sections: ViewportIconButtonDef[][];
	  };

export interface ViewportIconViewportState {
	layout: ViewportIconLayoutItem[];
}

export type ViewportIconsStateByViewport = Record<
	string,
	ViewportIconViewportState
>;

export interface IShapeDiverViewportIconsStore {
	viewports: ViewportIconsStateByViewport;

	// add icon or group (array => group). Optional index; append if omitted/invalid.
	add: (
		viewportId: string,
		input: ViewportIconButtonDef | ViewportIconButtonDef[],
		index?: number,
	) => void;

	// remove by index (no-op if out of range)
	remove: (viewportId: string, index: number) => void;

	// clear all icons for a viewport
	clear: (viewportId: string) => void;
}
