import {devtoolsSettings} from "@AppBuilderShared/store/storeSettings";
import {
	ButtonRenderContext,
	IShapeDiverViewportIconsStore,
	ViewportIconButton,
	ViewportIconButtonEnum,
	ViewportIconLayoutItem,
	ViewportIconLayoutItemEnum,
	ViewportIconViewportState,
	ViewportTypeToIcon,
} from "@AppBuilderShared/types/store/shapediverStoreViewportIcons";
import {Divider, DividerProps} from "@mantine/core";
import {IViewportApi} from "@shapediver/viewer.viewport";
import React from "react";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

const emptyViewport: ViewportIconViewportState = {layout: []};

const getCurrentViewportIcons = (
	state: IShapeDiverViewportIconsStore,
	viewportId: string,
): ViewportIconViewportState =>
	state.viewportIcons[viewportId] ?? emptyViewport;

function renderButtonByKind(
	kind: ViewportIconButtonEnum,
	context: ButtonRenderContext,
): React.ReactNode {
	const {
		viewport,
		namespace,
		buttonsDisabled,
		executing,
		hasPendingChanges,
		iconsVisible,
		fullscreenId,
		...commonProps
	} = context;

	switch (kind) {
		case ViewportIconButtonEnum.Ar:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Ar],
				{key: "ar", viewport, ...commonProps},
			);
		case ViewportIconButtonEnum.Zoom:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Zoom],
				{key: "zoom", viewport, ...commonProps},
			);
		case ViewportIconButtonEnum.Fullscreen:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Fullscreen],
				{
					key: "fullscreen",
					fullscreenId,
					enableFullscreenBtn: true,
					...commonProps,
				},
			);
		case ViewportIconButtonEnum.Cameras:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Cameras],
				{
					key: "cameras",
					viewport,
					visible: iconsVisible,
					...commonProps,
				},
			);
		case ViewportIconButtonEnum.Undo:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Undo],
				{
					key: "undo",
					disabled: buttonsDisabled || executing || hasPendingChanges,
					hasPendingChanges,
					executing,
					...commonProps,
				},
			);
		case ViewportIconButtonEnum.Redo:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Redo],
				{
					key: "redo",
					disabled: buttonsDisabled || executing || hasPendingChanges,
					hasPendingChanges,
					executing,
					...commonProps,
				},
			);
		case ViewportIconButtonEnum.Reload:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Reload],
				{
					key: "reload",
					disabled:
						!namespace ||
						buttonsDisabled ||
						executing ||
						hasPendingChanges,
					namespace: namespace || "",
					hasPendingChanges,
					executing,
					...commonProps,
				},
			);
		case ViewportIconButtonEnum.HistoryMenu:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.HistoryMenu],
				{
					key: "historyMenu",
					disabled:
						!namespace || buttonsDisabled || hasPendingChanges,
					namespace: namespace || "",
					visible: iconsVisible,
					...commonProps,
				},
			);
		default:
			return null;
	}
}

export const useShapeDiverViewportIconsStore =
	create<IShapeDiverViewportIconsStore>()(
		devtools(
			(set, get) => ({
				viewportIcons: {},

				initialize: (viewport: IViewportApi) => {
					const showCamerasButton =
						Object.keys(viewport ? viewport.cameras : {}).length >
						1; // Don't show the cameras button if there is only one camera or no cameras

					get().add(viewport.id, [
						...(viewport.enableAR
							? [{type: ViewportIconButtonEnum.Ar}]
							: []),
						{type: ViewportIconButtonEnum.Zoom},
						...(showCamerasButton
							? [{type: ViewportIconButtonEnum.Cameras}]
							: []),
						{type: ViewportIconButtonEnum.Fullscreen},
					]);
					get().add(viewport.id, [
						{type: ViewportIconButtonEnum.Undo},
						{type: ViewportIconButtonEnum.Redo},
						{type: ViewportIconButtonEnum.Reload},
						{type: ViewportIconButtonEnum.HistoryMenu},
					]);
				},

				add: (
					viewportId: string,
					input: ViewportIconButton | ViewportIconButton[],
					index?: number,
				) => {
					set(
						(state) => {
							const currentVp = getCurrentViewportIcons(
								state,
								viewportId,
							);

							const toInsert: ViewportIconLayoutItem = (() => {
								if (!Array.isArray(input)) {
									return {
										type: ViewportIconLayoutItemEnum.Button,
										button: input as ViewportIconButton,
									};
								}

								return {
									type: ViewportIconLayoutItemEnum.Group,
									sections: [input as ViewportIconButton[]],
								};
							})();

							const nextVp: ViewportIconViewportState = index
								? {
										layout: [
											...currentVp.layout.slice(0, index),
											toInsert,
											...currentVp.layout.slice(index),
										],
									}
								: {
										layout: [...currentVp.layout, toInsert],
									};

							return {
								...state,
								viewportIcons: {
									...state.viewportIcons,
									[viewportId]: nextVp,
								},
							};
						},
						false,
						`icons:add ${viewportId}`,
					);
				},

				remove: (viewportId: string, index: number) => {
					set(
						(state) => {
							const prevVp = getCurrentViewportIcons(
								state,
								viewportId,
							);
							if (!Number.isInteger(index)) return state;
							const nextVp: ViewportIconViewportState = {
								layout: [
									...prevVp.layout.slice(0, index),
									...prevVp.layout.slice(index + 1),
								],
							};

							return {
								...state,
								viewportIcons: {
									...state.viewportIcons,
									[viewportId]: nextVp,
								},
							};
						},
						false,
						`icons:remove ${viewportId}:${index}`,
					);
				},
				clear: (viewportId: string) => {
					set(
						(state) => {
							return {
								...state,
								viewportIcons: {
									...state.viewportIcons,
									[viewportId]: emptyViewport,
								},
							};
						},
						false,
						`icons:clear ${viewportId}`,
					);
				},
				/** Manage common props and render the viewport icons, based on the viewport icons state (buttons and groups) */
				render: (
					viewportId: string,
					buttonContext: ButtonRenderContext,
					dividerProps: DividerProps,
				) => {
					const sections: React.ReactNode[] = [];
					const viewportIcons =
						get().viewportIcons[viewportId]?.layout;

					if (!viewportIcons) return sections;

					viewportIcons.forEach((item, index) => {
						if (item.type === "button") {
							const button = renderButtonByKind(
								item.button.type,
								buttonContext,
							);
							if (button) sections.push(button);
						} else if (item.type === "group") {
							const groupButtons: React.ReactNode[] = [];
							item.sections.forEach((section) => {
								section.forEach((buttonDef) => {
									const button = renderButtonByKind(
										buttonDef.type,
										buttonContext,
									);
									if (button) groupButtons.push(button);
								});
								// Add divider between sections within a group
								if (
									groupButtons.length > 0 &&
									section !==
										item.sections[item.sections.length - 1]
								) {
									groupButtons.push(
										React.createElement(Divider, {
											key: `divider-${index}-${section.length}`,
											...dividerProps,
										}),
									);
								}
							});
							sections.push(
								React.createElement(
									React.Fragment,
									{key: `group-${index}`},
									...groupButtons,
								),
							);
						}

						// Add divider between layout items
						if (index < viewportIcons.length - 1) {
							sections.push(
								React.createElement(Divider, {
									key: `layout-divider-${index}`,
									...dividerProps,
								}),
							);
						}
					});

					return sections;
				},
			}),
			{...devtoolsSettings, name: "ShapeDiver | ViewportIcons"},
		),
	);
