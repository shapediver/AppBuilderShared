import {devtoolsSettings} from "@AppBuilderLib/shared/config/storeSettings";
import {IViewportApi} from "@shapediver/viewer.viewport";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {
	DefaultViewportToolbarButton,
	DefaultViewportToolbarButtonEnum,
	DefaultViewportToolbarLayoutItem,
	DefaultViewportToolbarLayoutItemEnum,
	DefaultViewportToolbarViewportState,
	IShapeDiverDefaultViewportToolbarStore,
} from "../config/shapediverStoreDefaultViewportToolbar";

const emptyViewport: DefaultViewportToolbarViewportState = {layout: []};

const getCurrentDefaultViewportToolbar = (
	state: IShapeDiverDefaultViewportToolbarStore,
	viewportId: string,
): DefaultViewportToolbarViewportState =>
	state.defaultViewportToolbars[viewportId] ?? emptyViewport;

export const useShapeDiverDefaultViewportToolbarStore =
	create<IShapeDiverDefaultViewportToolbarStore>()(
		devtools(
			(set, get) => ({
				defaultViewportToolbars: {},
				viewerFullscreen3States: false,

				setViewerFullscreen3States: (value: boolean) =>
					set(
						{viewerFullscreen3States: value},
						false,
						"setViewerFullscreen3States",
					),
				initialize: (viewport: IViewportApi) => {
					const showCamerasButton =
						Object.keys(viewport ? viewport.cameras : {}).length >
						1; // Don't show the cameras button if there is only one camera or no cameras

					get().add(viewport.id, [
						...(viewport.enableAR
							? [{type: DefaultViewportToolbarButtonEnum.Ar}]
							: []),
						{type: DefaultViewportToolbarButtonEnum.Zoom},
						...(showCamerasButton
							? [{type: DefaultViewportToolbarButtonEnum.Cameras}]
							: []),
						{type: DefaultViewportToolbarButtonEnum.Fullscreen},
						{
							type: DefaultViewportToolbarButtonEnum.Fullscreen3States,
						},
					]);
					get().add(viewport.id, [
						{type: DefaultViewportToolbarButtonEnum.Undo},
						{type: DefaultViewportToolbarButtonEnum.Redo},
						{type: DefaultViewportToolbarButtonEnum.Reload},
						{type: DefaultViewportToolbarButtonEnum.HistoryMenu},
					]);
				},

				add: (
					viewportId: string,
					input:
						| DefaultViewportToolbarButton
						| DefaultViewportToolbarButton[],
					index?: number,
				) => {
					set(
						(state) => {
							const currentVp = getCurrentDefaultViewportToolbar(
								state,
								viewportId,
							);

							const toInsert: DefaultViewportToolbarLayoutItem =
								(() => {
									if (!Array.isArray(input)) {
										return {
											type: DefaultViewportToolbarLayoutItemEnum.Button,
											button: input as DefaultViewportToolbarButton,
										};
									}

									return {
										type: DefaultViewportToolbarLayoutItemEnum.Group,
										sections: [
											input as DefaultViewportToolbarButton[],
										],
									};
								})();

							const nextVp: DefaultViewportToolbarViewportState =
								index
									? {
											layout: [
												...currentVp.layout.slice(
													0,
													index,
												),
												toInsert,
												...currentVp.layout.slice(
													index,
												),
											],
										}
									: {
											layout: [
												...currentVp.layout,
												toInsert,
											],
										};

							return {
								...state,
								defaultViewportToolbars: {
									...state.defaultViewportToolbars,
									[viewportId]: nextVp,
								},
							};
						},
						false,
						`defaultToolbar:add ${viewportId}`,
					);
				},

				remove: (viewportId: string, index: number) => {
					set(
						(state) => {
							const prevVp = getCurrentDefaultViewportToolbar(
								state,
								viewportId,
							);
							if (!Number.isInteger(index)) return state;
							const nextVp: DefaultViewportToolbarViewportState =
								{
									layout: [
										...prevVp.layout.slice(0, index),
										...prevVp.layout.slice(index + 1),
									],
								};

							return {
								...state,
								defaultViewportToolbars: {
									...state.defaultViewportToolbars,
									[viewportId]: nextVp,
								},
							};
						},
						false,
						`defaultToolbar:remove ${viewportId}:${index}`,
					);
				},
				clear: (viewportId: string) => {
					set(
						(state) => {
							return {
								...state,
								defaultViewportToolbars: {
									...state.defaultViewportToolbars,
									[viewportId]: emptyViewport,
								},
							};
						},
						false,
						`defaultToolbar:clear ${viewportId}`,
					);
				},
			}),
			{...devtoolsSettings, name: "ShapeDiver | DefaultViewportToolbar"},
		),
	);
