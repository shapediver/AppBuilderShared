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
					const anchorList = anchors[viewportId].filter(
						(a) => a.type === "3d",
					);
					if (!anchorList) return;

					// Update the anchor's distance first
					const updatedAnchors = anchorList.map((a) =>
						a.id === anchorId ? {...a, distance} : a,
					);

					// Sort by the new distances
					const sortedAnchors = [...updatedAnchors].sort((a, b) => {
						// special case if currently showing content
						if (!a.showContent && b.showContent) return -1;
						if (a.showContent && !b.showContent) return 1;
						return b.distance - a.distance;
					});

					// Update zIndex for all anchors based on sorted order
					sortedAnchors.forEach((a, idx) => {
						a.setZIndex(idx);
					});

					set(
						(state) => ({
							anchors: {
								...state.anchors,
								[viewportId]: updatedAnchors,
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
