import { IViewportApi, ViewportCreationDefinition } from "@shapediver/viewer.viewport";
import { IEventTracking } from "../eventTracking";


/**
 * Redeclaration of ViewportCreationDefinition to always have an id.
 */
export interface ViewportCreateDto extends ViewportCreationDefinition {
	showStatistics?: boolean,
}

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
	viewports: IShapeDiverStoreViewports

	/**
	 * Create a viewport and add it to the store.
	 * @param dto
	 * @returns
	 */
	createViewport: (
		dto: ViewportCreateDto,
		callbacks?: IShapeDiverStoreViewportCallbacks
	) => Promise<IViewportApi | undefined>;

	/**
	 * Close a viewport and remove it from the store.
	 */
	closeViewport: (
		viewportId: string,
		callbacks?: IShapeDiverStoreViewportCallbacks
	) => Promise<void>;
}