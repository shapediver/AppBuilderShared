import {IShapeDiverStoreViewportAnchors2d} from "@AppBuilderShared/types/store/shapediverStoreViewportAnchors2d";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {devtoolsSettings} from "./storeSettings";

export const useShapeDiverStoreViewportAnchors2d =
	create<IShapeDiverStoreViewportAnchors2d>()(
		devtools(
			(set, get) => ({
				anchors: {},

				addAnchor: (viewportId, anchor) => {
					set(
						(state) => ({
							anchors: {
								...state.anchors,
								[viewportId]: [
									...(state.anchors[viewportId] || []),
									anchor,
								],
							},
						}),
						false,
						`addAnchor ${viewportId} ${anchor.id}`,
					);
				},

				removeAnchor: (viewportId, anchorId) => {
					const {anchors} = get();

					if (!anchors[viewportId]) return;

					set(
						(state) => ({
							anchors: {
								...state.anchors,
								[viewportId]: state.anchors[viewportId].filter(
									(anchor) => anchor.id !== anchorId,
								),
							},
						}),
						false,
						`removeAnchor ${viewportId} ${anchorId}`,
					);
				},
			}),
			{
				...devtoolsSettings,
				name: "ShapeDiver | Viewport Anchors",
			},
		),
	);
