import {IShapeDiverStoreViewportAnchors} from "@AppBuilderShared/types/store/shapediverStoreViewportAnchors";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {devtoolsSettings} from "./storeSettings";

export const useShapeDiverStoreViewportAnchors =
	create<IShapeDiverStoreViewportAnchors>()(
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

				updateDistance: (viewportId, anchorId, distance) => {
					const {anchors} = get();
					const anchor = anchors[viewportId]?.find(
						(anchor) => anchor.id === anchorId,
					);
					if (!anchor) return;
					set(
						(state) => ({
							anchors: {
								...state.anchors,
								[viewportId]: state.anchors[viewportId].map(
									(a) =>
										a.id === anchorId
											? {...a, distance}
											: a,
								),
							},
						}),
						false,
						`updateDistance ${viewportId} ${anchorId} ${distance}`,
					);
				},
			}),
			{
				...devtoolsSettings,
				name: "ShapeDiver | Viewport Anchors",
			},
		),
	);
