import {devtoolsSettings} from "@AppBuilderShared/store/storeSettings";
import {
	IShapeDiverViewportIconsStore,
	ViewportIconButtonDef,
	ViewportIconLayoutItem,
	ViewportIconLayoutItemType,
	ViewportIconViewportState,
} from "@AppBuilderShared/types/store/shapediverStoreViewportIcons";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

const emptyViewport: ViewportIconViewportState = {layout: []};

const getCurrentViewport = (
	state: IShapeDiverViewportIconsStore,
	viewportId: string,
): ViewportIconViewportState => state.viewports[viewportId] ?? emptyViewport;

export const useShapeDiverViewportIconsStore =
	create<IShapeDiverViewportIconsStore>()(
		devtools(
			(set) => ({
				viewports: {},

				add: (
					viewportId: string,
					input: ViewportIconButtonDef | ViewportIconButtonDef[],
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
										type: ViewportIconLayoutItemType.Button,
										button: input as ViewportIconButtonDef,
									};
								}

								return {
									type: ViewportIconLayoutItemType.Group,
									sections: [
										input as ViewportIconButtonDef[],
									],
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
								viewports: {
									...state.viewports,
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
								viewports: {
									...state.viewports,
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
								viewports: {
									...state.viewports,
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
