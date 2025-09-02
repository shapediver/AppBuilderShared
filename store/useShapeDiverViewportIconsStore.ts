import {devtoolsSettings} from "@AppBuilderShared/store/storeSettings";
import {
	IShapeDiverViewportIconsStore,
	ViewportIconButton,
	ViewportIconButtonEnum,
	ViewportIconLayoutItem,
	ViewportIconLayoutItemEnum,
	ViewportIconViewportState,
} from "@AppBuilderShared/types/store/shapediverStoreViewportIcons";
import {IViewportApi} from "@shapediver/viewer.viewport";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

const emptyViewport: ViewportIconViewportState = {layout: []};

const getCurrentViewportIcons = (
	state: IShapeDiverViewportIconsStore,
	viewportId: string,
): ViewportIconViewportState =>
	state.viewportIcons[viewportId] ?? emptyViewport;

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
			}),
			{...devtoolsSettings, name: "ShapeDiver | ViewportIcons"},
		),
	);
