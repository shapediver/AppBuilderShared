export interface IAnchor {
	distance: number;
	showContent: boolean;
	setShowContent: (showContent: boolean) => void;
	setZIndex: (zIndex: number) => void;
	id: string;
}

export interface IShapeDiverStoreViewportAnchors {
	/**
	 * The viewport anchors currently known by the store.
	 * The key is the anchor ID.
	 */
	anchors: {
		[viewportId: string]: IAnchor[];
	};

	/**
	 * Add an anchor to the store.
	 *
	 * @param viewportId
	 * @param anchor
	 */
	addAnchor: (viewportId: string, anchor: IAnchor) => void;

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
	 * @param anchorId
	 * @param distance
	 * @returns
	 */
	updateDistance: (
		viewportId: string,
		anchorId: string,
		distance: number,
	) => void;
}
