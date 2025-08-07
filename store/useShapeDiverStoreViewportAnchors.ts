import {simplifyCalc} from "@AppBuilderShared/components/shapediver/viewport/anchors/shared/utils";
import {AppBuilderContainerNameType} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IShapeDiverStoreViewportAnchors} from "@AppBuilderShared/types/store/shapediverStoreViewportAnchors";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {devtoolsSettings} from "./storeSettings";

export const useShapeDiverStoreViewportAnchors =
	create<IShapeDiverStoreViewportAnchors>()(
		devtools(
			(set, get) => ({
				anchors: {},
				showContentMap: {},
				dragOffsetMap: {},

				addAnchor: (viewportId, anchor) => {
					set(
						(state) => {
							const existingAnchors =
								state.anchors[viewportId] || [];

							// Remove any anchor with the same id and type
							const filteredAnchors = existingAnchors.filter(
								(a) =>
									!(
										a.id === anchor.id &&
										a.type === anchor.type
									),
							);
							// Restore showContent from map if present
							const showContent =
								state.showContentMap[viewportId]?.[anchor.id]?.[
									anchor.type
								] ??
								anchor.showContent ??
								false;
							return {
								anchors: {
									...state.anchors,
									[viewportId]: [
										...filteredAnchors,
										{...anchor, showContent},
									],
								},
							};
						},
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
						(a) => a.type === AppBuilderContainerNameType.Anchor3d,
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
						return (b.distance || 0) - (a.distance || 0);
					});

					// Create a new array with updated zIndex immutably
					const sortedAnchorsWithZIndex = sortedAnchors.map(
						(a, idx) => ({
							...a,
							zIndex: idx,
						}),
					);

					set(
						(state) => ({
							anchors: {
								...state.anchors,
								[viewportId]: [
									// keep non-3d anchors untouched
									...(state.anchors[viewportId]?.filter(
										(a) =>
											a.type !==
											AppBuilderContainerNameType.Anchor3d,
									) ?? []),
									...sortedAnchorsWithZIndex,
								],
							},
						}),
						false,
						`updateDistance ${viewportId} ${anchorId} ${distance}`,
					);
				},

				updateShowContent: (viewportId, anchorId, showContent) => {
					const {anchors} = get();
					const anchorList = anchors[viewportId];
					if (!anchorList) return;

					const anchorType = anchorList.find(
						(a) => a.id === anchorId,
					)?.type;

					if (!anchorType) return;

					const updatedAnchors = anchorList.map((a) => {
						if (a.id === anchorId) {
							return {...a, showContent};
						} else if (
							showContent &&
							a.type === anchorType &&
							a.hideable
						) {
							// If we are showing content, hide all other anchors
							// If they are hideable (if a previewIcon is defined)
							return {...a, showContent: false};
						}
						return a;
					});

					set(
						(state) => ({
							anchors: {
								...state.anchors,
								[viewportId]: updatedAnchors,
							},
							showContentMap: {
								...state.showContentMap,
								[viewportId]: {
									...state.showContentMap[viewportId],
									[anchorId]: {
										[anchorType]: showContent,
									},
								},
							},
						}),
						false,
						`updateShowContent ${viewportId} ${anchorId} ${showContent}`,
					);
				},

				updateDragOffset: (viewportId, anchorId, offset) => {
					const {dragOffsetMap} = get();

					const prevOffset = dragOffsetMap[viewportId]?.[anchorId];
					const newOffset = prevOffset
						? {
								x: simplifyCalc(
									`calc(${prevOffset.x} + ${offset.x})`,
								),
								y: simplifyCalc(
									`calc(${prevOffset.y} + ${offset.y})`,
								),
							}
						: offset;

					set(
						(state) => ({
							dragOffsetMap: {
								...state.dragOffsetMap,
								[viewportId]: {
									...state.dragOffsetMap[viewportId],
									[anchorId]: newOffset,
								},
							},
						}),
						false,
						`updateDragOffset ${viewportId} ${anchorId} ${JSON.stringify(newOffset)}`,
					);
				},
			}),
			{
				...devtoolsSettings,
				name: "ShapeDiver | Viewport Anchors",
			},
		),
	);
