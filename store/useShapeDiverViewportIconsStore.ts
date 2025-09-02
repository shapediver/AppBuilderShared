import {devtoolsSettings} from "@AppBuilderShared/store/storeSettings";
import {
	IShapeDiverViewportIconsStore,
	ViewportIconButton,
	ViewportIconLayoutItem,
	ViewportIconLayoutItemEnum,
	ViewportIconViewportState,
} from "@AppBuilderShared/types/store/shapediverStoreViewportIcons";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

const emptyViewport: ViewportIconViewportState = {layout: []};

const getCurrentViewport = (
	state: IShapeDiverViewportIconsStore,
	viewportId: string,
): ViewportIconViewportState =>
	state.viewportIcons[viewportId] ?? emptyViewport;

export const useShapeDiverViewportIconsStore =
	create<IShapeDiverViewportIconsStore>()(
		devtools(
			(set) => ({
				viewportIcons: {},

				add: (
					viewportId: string,
					input: ViewportIconButton | ViewportIconButton[],
					index?: number,
				) => {
					set(
						(state) => {
							const currentVp = getCurrentViewport(
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
							const prevVp = getCurrentViewport(
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
