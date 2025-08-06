export interface IAnchor3d {
	/**
	 * The distance from the camera to the anchor.
	 * This is used to sort the anchors by distance.
	 * The anchor with the smallest distance will have the highest z-index.
	 */
	distance: number;
	/**
	 * Whether the anchor is currently showing content.
	 * This is used to switch off the other anchors when one is showing content.
	 * If an anchor is showing content, it will be placed on top of the others.
	 */
	showContent: boolean;
	/**
	 * The setter for the showContent property.
	 *
	 * @param showContent
	 */
	setShowContent: (showContent: boolean) => void;
	/**
	 * The setter for the z-index of the anchor.
	 *
	 * @param zIndex
	 */
	setZIndex: (zIndex: number) => void;
	/**
	 * The unique identifier for the anchor.
	 * This is used to identify the anchor in the store.
	 */
	id: string;
}

export interface IShapeDiverStoreViewportAnchors3d {
	/**
	 * The viewport anchors currently known by the store.
	 * The key is the anchor ID.
	 */
	anchors: {
		[viewportId: string]: IAnchor3d[];
	};

	/**
	 * Add an anchor to the store.
	 *
	 * @param viewportId
	 * @param anchor
	 */
	addAnchor: (viewportId: string, anchor: IAnchor3d) => void;

	/**
	 * Remove an anchor from the store.
	 *
	 * @param viewportId
	 * @param anchorId
	 */
	removeAnchor: (viewportId: string, anchorId: string) => void;

	/**
	 * Update the distance of an anchor in the store.
	 *
	 * @param viewportId
	 * @param anchor3dId
	 * @param distance
	 * @returns
	 */
	updateDistance: (
		viewportId: string,
		anchor3dId: string,
		distance: number,
	) => void;
}
