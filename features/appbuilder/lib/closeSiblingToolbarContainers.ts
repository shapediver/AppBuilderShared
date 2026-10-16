import {useShapeDiverStoreViewportAnchors} from "@AppBuilderLib/entities/viewport-anchor/model/useShapeDiverStoreViewportAnchors";

/**
 * Closes every toolbar-targeted anchor except the ids about to open.
 * Used when a toolbar has `exclusiveContainers` and is about to open one or more panels.
 */
export function closeSiblingToolbarContainers(
	viewportId: string,
	openId: string | readonly string[],
	siblingIds: readonly string[],
): void {
	if (!viewportId || siblingIds.length === 0) return;

	const keepOpen = new Set(typeof openId === "string" ? [openId] : openId);
	const {updateShowContent} = useShapeDiverStoreViewportAnchors.getState();
	for (const id of siblingIds) {
		if (keepOpen.has(id)) continue;
		updateShowContent(viewportId, id, false);
	}
}
