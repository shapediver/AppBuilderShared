import {useShapeDiverStoreViewportAnchors} from "@AppBuilderShared/store/useShapeDiverStoreViewportAnchors";
import {
	IAnchor2d,
	IAnchor3d,
} from "@AppBuilderShared/types/store/shapediverStoreViewportAnchors";
import {useEffect} from "react";

/**
 * Hook to register a viewport anchor.
 * @param viewportId The ID of the viewport.
 * @param anchorDefinition The definition of the anchor to register.
 */
export function useRegisterAnchor(
	viewportId: string,
	anchorDefinition: IAnchor2d | IAnchor3d,
) {
	const {anchors, addViewportAnchor, removeViewportAnchor} =
		useShapeDiverStoreViewportAnchors((state) => ({
			anchors: state.anchors,
			addViewportAnchor: state.addAnchor,
			removeViewportAnchor: state.removeAnchor,
			updateDistance: state.updateDistance,
		}));

	/**
	 * Update the showContent state in the store when the showContent state changes.
	 * This ensures that the anchor's showContent state is always in sync with the store.
	 */
	useEffect(() => {
		// update the anchor's showContent state in the store
		const anchor = anchors[viewportId]?.find(
			(anchor) => anchor.id === anchorDefinition.id,
		);
		if (anchor) anchor.showContent = anchorDefinition.showContent;
	}, [anchorDefinition.id, anchorDefinition.showContent]);

	/**
	 * This effect runs when the component mounts and adds the anchor to the store.
	 * It checks if there is already an anchor with the same id in the store.
	 * If there is, it sets the showContent state to the existing anchor's showContent state
	 * and removes the existing anchor.
	 *
	 * Then it adds the new anchor to the store with the given id and initial properties.
	 */
	useEffect(() => {
		const existingAnchor = anchors[viewportId]?.find(
			(anchor) =>
				anchor.id === anchorDefinition.id &&
				anchor.type === anchorDefinition.type,
		);
		// check if there is already an anchor with the same id
		if (existingAnchor) {
			// set the showContent state to the existing anchor's showContent state
			anchorDefinition.setShowContent(existingAnchor.showContent);
			// remove the existing anchor
			removeViewportAnchor(viewportId, existingAnchor.id);
		}

		addViewportAnchor(viewportId, anchorDefinition);
	}, [viewportId, anchorDefinition]);
}
