import {IEventTracking} from "@AppBuilderShared/types/eventTracking";
import {ViewportCreateDto} from "@AppBuilderShared/types/shapediver/viewport";
import {IAttributeVisualizationEngine} from "@shapediver/viewer.features.attribute-visualization";
import {IViewportApi} from "@shapediver/viewer.viewport";

export interface IShapeDiverStoreViewports {
	[viewportId: string]: IViewportApi;
}

/**
 * Callbacks related to IShapeDiverStore.
 */
export type IShapeDiverStoreViewportCallbacks = Pick<IEventTracking, "onError">;

/**
 * Interface for the store of viewer-related data.
 */
export interface IShapeDiverStoreViewport {
	/**
	 * Viewports currently known by the store.
	 */
	viewports: IShapeDiverStoreViewports;

	/**
	 * Attribute visualization engines currently known by the store.
	 */
	attributeVisualizationEngines: {
		[viewportId: string]: IAttributeVisualizationEngine;
	};

	/**
	 * Create a viewport and add it to the store.
	 * @param dto
	 * @returns
	 */
	createViewport: (
		dto: ViewportCreateDto,
		callbacks?: IShapeDiverStoreViewportCallbacks,
	) => Promise<IViewportApi | undefined>;

	/**
	 * Close a viewport and remove it from the store.
	 */
	closeViewport: (
		viewportId: string,
		callbacks?: IShapeDiverStoreViewportCallbacks,
	) => Promise<void>;

	/**
	 * Create an attribute visualization engine for a viewport and add it to the store.
	 * @param viewportId
	 * @returns
	 */
	createAttributeVisualizationEngine: (
		viewportId: string,
	) => IAttributeVisualizationEngine | undefined;

	/**
	 * Close an attribute visualization engine and remove it from the store.
	 */
	closeAttributeVisualizationEngine: (viewportId: string) => void;
}
