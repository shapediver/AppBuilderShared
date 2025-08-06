export interface IAnchor2d {
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

export interface IShapeDiverStoreViewportAnchors2d {
	/**
	 * The viewport anchors currently known by the store.
	 * The key is the anchor ID.
	 */
	anchors: {
		[viewportId: string]: IAnchor2d[];
	};

	/**
	 * Add an anchor to the store.
	 *
	 * @param viewportId
	 * @param anchor
	 */
	addAnchor: (viewportId: string, anchor: IAnchor2d) => void;

	/**
	 * Remove an anchor from the store.
	 *
	 * @param viewportId
	 * @param anchorId
	 */
	removeAnchor: (viewportId: string, anchorId: string) => void;
}
