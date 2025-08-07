import {AppBuilderContainerNameType} from "../shapediver/appbuilder";

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
	 * Whether the anchor is currently hideable.
	 */
	hideable: boolean;
	/**
	 * The type of the anchor.
	 */
	type:
		| AppBuilderContainerNameType.Anchor2d
		| AppBuilderContainerNameType.Anchor3d;
}

export interface IAnchor2d extends IAnchorGeneric {
	type: AppBuilderContainerNameType.Anchor2d;
}

export interface IAnchor3d extends IAnchorGeneric {
	type: AppBuilderContainerNameType.Anchor3d;
	/**
	 * The distance from the camera to the anchor.
	 * This is used to sort the anchors by distance.
	 * The anchor with the smallest distance will have the highest z-index.
	 */
	distance?: number;
	/**
	 * The z-index of the anchor.
	 * This is used to control the stacking order of the anchors.
	 * The anchor with the highest z-index will be on top.
	 */
	zIndex?: number;
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
	 * Store the state of the showContent for each anchor.
	 * This is used to manage the visibility of anchor content.
	 * The key is the viewportId, the value is an object where the key is the anchorId
	 * and the value is an object with the showContent state for each anchor type.
	 */
	showContentMap: {
		[viewportId: string]: {
			[anchorId: string]: {
				[K in
					| AppBuilderContainerNameType.Anchor2d
					| AppBuilderContainerNameType.Anchor3d]?: boolean;
			};
		};
	};

	/**
	 * Store the drag offsets for each anchor.
	 * This is used to manage the position of anchors when they are dragged.
	 * The key is the viewportId, the value is an object where the key is the anchorId
	 * and the value is an object with the x and y offsets.
	 */
	dragOffsetMap: {
		[viewportId: string]: {
			[anchorId: string]: {
				x: string;
				y: string;
			};
		};
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

	/**
	 * Update the showContent state of an anchor in the store.
	 * If the showContent state is set to true, it will hide all other anchors' content
	 * where the anchor shares the same viewportId and type.
	 *
	 * @param viewportId
	 * @param anchorId
	 * @param showContent
	 * @returns
	 */
	updateShowContent: (
		viewportId: string,
		anchorId: string,
		showContent: boolean,
	) => void;

	/**
	 * Update the drag offset of an anchor in the store.
	 * If there already is a drag offset for the anchor, it will be added to the existing offset.
	 *
	 * @param viewportId
	 * @param anchorId
	 * @param offset
	 * @returns
	 */
	updateDragOffset: (
		viewportId: string,
		anchorId: string,
		offset: {x: string; y: string},
	) => void;
}
