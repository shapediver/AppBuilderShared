import {IAppBuilderParameterValueSourcePropsScreenshot} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {FLAG_TYPE} from "@shapediver/viewer.session";

import type {ActiveCamera} from "../lib/readActiveCamera";
import {ViewportCreateDto} from "./viewport";

export interface IShapeDiverStoreViewportAccessFunctions {
	[viewportId: string]: IViewportAccessFunctions;
}

/**
 * Interface for the store of viewer-related data.
 */
export interface IShapeDiverStoreViewportAccessFunctionsStore {
	/**
	 * Add the access functions for a viewport to the store.
	 */
	addViewportAccessFunctions: (
		viewportId: string,
		accessFunctions: IViewportAccessFunctions,
	) => void;

	/**
	 * Remove the access functions for a viewport from the store.
	 */
	removeViewportAccessFunctions: (viewportId: string) => void;

	/**
	 * Viewports access functions currently known by the store.
	 */
	viewportAccessFunctions: IShapeDiverStoreViewportAccessFunctions;
}

export interface IViewportAccessFunctions {
	/** The creation DTO of the viewport. */
	dto: ViewportCreateDto;

	/** Function to add a flag to the viewport. */
	addFlag?: (flag: FLAG_TYPE) => string;

	/** Function to convert the viewport to glTF */
	convertToGlTF?: () => Promise<Blob>;

	/**
	 * Function to read the active camera of the viewport as a plain document.
	 * Hosts register this so camera state can be read without depending on
	 * a specific viewer implementation (e.g. agent tools, e-commerce API).
	 */
	getCamera?: () => ActiveCamera | undefined;

	/**
	 * Function to list the names of the scene nodes currently matching a
	 * selection nameFilter. ShapeDiver `useViewport` registers it from
	 * `entities/parameter/lib/findNodesByNameFilter`, so shared code on the
	 * `AppBuilderPage` path (agent tools) does not depend on
	 * `@shapediver/viewer.features.interaction`.
	 */
	getAvailableNodes?: (nameFilter: string[]) => string[];

	/** Function to create a screenshot and return it as a data URL. */
	getScreenshot?: (
		props?: IAppBuilderParameterValueSourcePropsScreenshot,
	) => Promise<string>;

	/** Function to remove a flag from the viewport. */
	removeFlag?: (token: string) => void;

	/**
	 * Function to zoom the viewport to fit the model.
	 * @param useAutoAdjustSetting Whether to evaluate the autoAdjust setting of the viewport (if true, the zoomTo will only be triggered if autoAdjust is true). If false, the zoomTo will be triggered regardless of the autoAdjust setting.
	 * @param options Optional parameters for the zoom operation.
	 */
	zoomTo?: (
		useAutoAdjustSetting: boolean,
		options?: {duration?: number},
	) => void;

	/**
	 * Resolves when this viewport is ready for visibility-dependent actions
	 * (`appready` camera/AR). ShapeDiver `useViewport` registers
	 * `waitUntilReady` from `entities/viewport/lib/waitUntilReady` (scene
	 * bounding box settled). Hosts that replace viewport visibility
	 * (iJewel/WebGi) should supply their own wait.
	 */
	waitUntilReady?: (signal?: AbortSignal) => Promise<void>;
}
