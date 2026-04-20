import {IEventTracking} from "@AppBuilderLib/shared/config";
import {IViewportApi} from "@shapediver/viewer.viewport";
import {ViewportCreateDto} from "./viewport";

export interface IShapeDiverStoreViewports {
	[viewportId: string]: IViewportApi;
}

/**
 * Callbacks related to IShapeDiverStore.
 */
export type IShapeDiverStoreViewportCallbacks = Partial<
	Pick<IEventTracking, "onError">
> & {
	onCreated?: (viewport: IViewportApi) => void;
	onClosed?: (viewportId: string) => void;
};

/**
 * Interface for the store of viewer-related data.
 */
export interface IShapeDiverStoreViewport {
	/**
	 * Viewports currently known by the store.
	 */
	viewports: IShapeDiverStoreViewports;

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
}
