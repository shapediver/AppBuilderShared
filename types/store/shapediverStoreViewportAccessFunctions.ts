// #region Interfaces (3)

export interface IShapeDiverStoreViewportAccessFunctions {
	// #region Public Indexers (1)

	[viewportId: string]: IViewportAccessFunctions;

	// #endregion Public Indexers (1)
}

/**
 * Interface for the store of viewer-related data.
 */
export interface IShapeDiverStoreViewportAccessFunctionsStore {
	// #region Properties (3)

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

	// #endregion Properties (3)
}

export interface IViewportAccessFunctions {
	// #region Properties (2)

	/** Function to convert the viewport to glTF */
	convertToGlTF?: () => Promise<Blob>;
	/** Function to create a screenshot and return it as a data URL. */
	getScreenshot?: () => Promise<string>;

	// #endregion Properties (2)
}

// #endregion Interfaces (3)
