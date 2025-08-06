interface IAnchorGeneric {
	/**
	 * The unique identifier for the anchor.
	 * This is used to identify the anchor in the store.
	 */
	id: string;
	/**
	 * Whether the anchor is currently showing content.
	 */
	showContent: boolean;
	/**
	 * The setter for the showContent property.
	 * In case of type "3d", this will be used to disable the anchor if another anchor is showing content.
	 *
	 * @param showContent
	 */
	setShowContent: (showContent: boolean) => void;
	/**
	 * The type of the anchor.
	 */
	type: "2d" | "3d";
}

export interface IAnchor2d extends IAnchorGeneric {
	type: "2d";
}

export interface IAnchor3d extends IAnchorGeneric {
	type: "3d";
	/**
	 * The distance from the camera to the anchor.
	 * This is used to sort the anchors by distance.
	 * The anchor with the smallest distance will have the highest z-index.
	 */
	distance: number;
	/**
	 * The setter for the z-index of the anchor.
	 *
	 * @param zIndex
	 */
	setZIndex: (zIndex: number) => void;
}

type IAnchor = IAnchor2d | IAnchor3d;

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
