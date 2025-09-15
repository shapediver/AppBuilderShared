import ArButton from "@AppBuilderShared/components/shapediver/viewport/buttons/ArButton";
import CamerasButton from "@AppBuilderShared/components/shapediver/viewport/buttons/CamerasButton";
import FullscreenButton from "@AppBuilderShared/components/shapediver/viewport/buttons/FullscreenButton";
import HistoryMenuButton from "@AppBuilderShared/components/shapediver/viewport/buttons/HistoryMenuButton";
import RedoButton from "@AppBuilderShared/components/shapediver/viewport/buttons/RedoButton";
import ReloadButton from "@AppBuilderShared/components/shapediver/viewport/buttons/ReloadButton";
import {CommonButtonProps} from "@AppBuilderShared/components/shapediver/viewport/buttons/types";
import UndoButton from "@AppBuilderShared/components/shapediver/viewport/buttons/UndoButton";
import ZoomButton from "@AppBuilderShared/components/shapediver/viewport/buttons/ZoomButton";
import {DividerProps} from "@mantine/core";
import {IViewportApi} from "@shapediver/viewer.viewport";
import {ReactNode} from "react";

export enum ViewportIconButtonEnum {
	Ar = "ar",
	Zoom = "zoom",
	Fullscreen = "fullscreen",
	Cameras = "cameras",
	Undo = "undo",
	Redo = "redo",
	Reload = "reload",
	HistoryMenu = "historyMenu",
}

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
	render: (
		viewportId: string,
		buttonContext: ButtonRenderContext,
		dividerProps: DividerProps,
	) => ReactNode[];
}

export interface ButtonRenderContext extends CommonButtonProps {
	viewport?: any;
	namespace?: string;
	buttonsDisabled: boolean;
	executing: boolean;
	hasPendingChanges: boolean;
	iconsVisible: boolean;
	fullscreenId: string;
}

export const ViewportTypeToIcon = {
	[ViewportIconButtonEnum.Ar]: ArButton,
	[ViewportIconButtonEnum.Zoom]: ZoomButton,
	[ViewportIconButtonEnum.Fullscreen]: FullscreenButton,
	[ViewportIconButtonEnum.Cameras]: CamerasButton,
	[ViewportIconButtonEnum.Undo]: UndoButton,
	[ViewportIconButtonEnum.Redo]: RedoButton,
	[ViewportIconButtonEnum.Reload]: ReloadButton,
	[ViewportIconButtonEnum.HistoryMenu]: HistoryMenuButton,
};
