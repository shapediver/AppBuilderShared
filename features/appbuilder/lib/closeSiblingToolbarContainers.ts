import {useShapeDiverStoreViewportAnchors} from "@AppBuilderLib/entities/viewport-anchor/model/useShapeDiverStoreViewportAnchors";

/**
 * Closes every toolbar-targeted anchor except `openId`.
 * Used when a toolbar has `exclusiveContainers` and is about to open one panel.
 */
export function closeSiblingToolbarContainers(
	viewportId: string,
	openId: string,
	siblingIds: readonly string[],
): void {
	if (!viewportId || siblingIds.length === 0) return;

	const {updateShowContent} = useShapeDiverStoreViewportAnchors.getState();
	for (const id of siblingIds) {
		if (id === openId) continue;
		updateShowContent(viewportId, id, false);
	}
}
