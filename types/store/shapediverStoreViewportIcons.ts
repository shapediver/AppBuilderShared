import {IViewportApi} from "@shapediver/viewer.viewport";
import {ViewportIconButtonEnum} from "../shapediver/viewportIcons";

export interface ViewportIconButton {
	type: ViewportIconButtonEnum;
	data?: Record<string, any>;
}

export enum ViewportIconLayoutItemEnum {
	Button = "button",
	Group = "group",
}

export type ViewportIconLayoutItem =
	| {type: ViewportIconLayoutItemEnum.Button; button: ViewportIconButton}
	| {
			type: ViewportIconLayoutItemEnum.Group;
			sections: ViewportIconButton[][];
	  };

export interface ViewportIconViewportState {
	layout: ViewportIconLayoutItem[];
}

export type ViewportIconsStateByViewport = Record<
	string,
	ViewportIconViewportState
>;

export interface IShapeDiverViewportIconsStore {
	viewportIcons: ViewportIconsStateByViewport;
	/**
	 * Whether the viewer is in fullscreen mode (UI elements hidden).
	 * When true, ViewportComponent covers the entire screen.
	 */
	viewerFullscreen: boolean;
	/**
	 * Set the viewer fullscreen state.
	 * @param value - true to enable viewer fullscreen, false to disable
	 */
	setViewerFullscreen: (value: boolean) => void;
	/**
	 * Initialize the viewport icons store for a viewport.
	 * @param viewportId
	 */
	initialize: (viewport: IViewportApi) => void;
	// add icon or group (array => group). Optional index; append if omitted/invalid.
	add: (
		viewportId: string,
		input: ViewportIconButton | ViewportIconButton[],
		index?: number,
	) => void;

	// remove by index (no-op if out of range)
	remove: (viewportId: string, index: number) => void;

	// clear all icons for a viewport
	clear: (viewportId: string) => void;
}
