import {
	ICrossWindowApiOptions,
	ICrossWindowPeerInfo,
} from "@AppBuilderShared/modules/crosswindowapi/types/crosswindowapi";

/**
 * An item to be added to the cart.
 *
 * For WooCommerce @see https://woocommerce.github.io/code-reference/classes/WC-Cart.html#method_add_to_cart
 *
 */
export interface IAddItemToCartData {
	/**
	 * Identifier of the product to add to the cart.
	 * Optional, defaults to the product defined by the context.
	 * Note that this productId is not necessarily the same as the id of the product
	 * in the e-commerce system. Translations of product identifiers can be done by
	 * the plug-in embedding App Builder in the respective e-commerce system.
	 */
	productId?: string;

	/** Quantity of the line item to add to the cart (number of units). Optional, defaults to 1. */
	quantity?: number;

	/**
	 * The custom price of the cart (line) item to be added.
	 */
	price?: number;

	/**
	 * The description of the cart (line) item to be added.
	 */
	description?: string;

	/**
	 * The id of the ShapeDiver model state that should be linked to the cart item.
	 */
	modelStateId?: string;

	/**
	 * Image data URL of the product to be added to the cart.
	 */
	imageUrl?: string;

	/** Model view URL of the Geometry Backend system the model state was created on. */
	modelViewUrl?: string;

	/** URL of the image saved as part of the model state. */
	modelStateImageUrl?: string;

	/** URL of the glTF asset saved as part of the model state. */
	modelStateGltfUrl?: string;

	/** URL of the usdz asset saved as part of the model state. */
	modelStateUsdzUrl?: string;
}

export interface IAddItemToCartReply {
	/**
	 * The id of the cart item that has been added.
	 */
	id: string;
}

/**
 * Profile data of the current user, if any.
 */
export interface IGetUserProfileReply {
	id: string;
	email?: string;
	name?: string;
}

/**
 * Information about the parent page (the page embedding an App Builder iframe).
 */
export interface IGetParentPageInfoReply {
	/**
	 * The URL of the parent page.
	 */
	href: string;
}

/**
 * Information about a model state that has been created.
 * Can be used by the parent page to update its URL, etc.
 */
export interface IUpdateSharingLinkData {
	/**
	 * The id of the ShapeDiver model state that was created.
	 */
	modelStateId: string;

	/**
	 * Whether the URL shown in the browser shall be updated
	 * with the newly created modelStateId.
	 */
	updateUrl?: boolean;

	/**
	 * Image URL of the screenshot associated with the model state.
	 */
	imageUrl?: string;
}

/**
 * Reply from the parent page after updating the sharing link.
 */
export interface IUpdateSharingLinkReply {
	/**
	 * The updated URL of the parent page.
	 */
	href: string;
}

/**
 * Data for setting parameters for a scrolling API data source.
 */
export interface IScrollingApiSetParametersData {
	/** The data source name. */
	source: string;
	/** The search terms to set. */
	terms?: string[];
	/** The preferred page size to set. */
	pageSize?: number;
	/** Optional function for resetting the (potentially cached) state of the scrolling API. */
	reset?: () => Promise<void>;
}

/**
 * Reply from the parent page to setting parameters
 * for a scrolling API data source.
 */
export interface IScrollingApiSetParametersReply<TItem> {
	/** If this is defined, the value to set for "hasNextPage" */
	hasNextPage: boolean | undefined;
	/**
	 * If this is defined, the list of items to set.
	 */
	items: TItem[] | undefined;
}

/**
 * Data for getting more items from a scrolling API data source.
 */
export interface IScrollingApiLoadMoreData {
	/** The data source name. */
	source: string;
}

/**
 * Reply from the parent page to loading more data
 * from a scrolling API data source.
 */
export interface IScrollingApiLoadMoreReply<TItem> {
	/** The value to set for "hasNextPage" */
	hasNextPage: boolean;
	/**
	 * The list of items to append to the existing items.
	 */
	items: TItem[];
}

/**
 * Generic e-commerce API actions.
 */
export interface IECommerceApiActions {
	/**
	 * Add an item to the cart.
	 * @param data
	 */
	addItemToCart(data: IAddItemToCartData): Promise<IAddItemToCartReply>;

	/**
	 * Get the user profile.
	 */
	getUserProfile(): Promise<IGetUserProfileReply>;

	/**
	 * Close the configurator modal / window.
	 * @returns true if the configurator was closed successfully, false otherwise.
	 */
	closeConfigurator(): Promise<boolean>;

	/**
	 * Get information about the parent page (the page embedding an App Builder iframe).
	 */
	getParentPageInfo(): Promise<IGetParentPageInfoReply>;

	/**
	 * A model state has been created, update the sharing link.
	 * @param data
	 */
	updateSharingLink(
		data: IUpdateSharingLinkData,
	): Promise<IUpdateSharingLinkReply>;

	/**
	 * Set the parameters for a scrolling API data source.
	 * @param data
	 */
	scrollingApiSetParameters(
		data: IScrollingApiSetParametersData,
	): Promise<IScrollingApiSetParametersReply<unknown>>;

	/**
	 * Load more items from a scrolling API data source.
	 * @param data
	 */
	scrollingApiLoadMore(
		data: IScrollingApiLoadMoreData,
	): Promise<IScrollingApiLoadMoreReply<unknown>>;
}

/**
 * Generic e-commerce API for the application consuming
 * the e-commerce functionality (e.g. a configurator).
 */
export interface IECommerceApi extends IECommerceApiActions {
	/**
	 * Resolved once the peer is ready.
	 * Rejected if the peer does not respond within the timeout.
	 */
	readonly peerIsReady: Promise<ICrossWindowPeerInfo>;
}

/**
 * Connector between the e-commerce API (used by the application consuming the
 * e-commerce functionality) and the e-commerce plugin (e.g. the ShapeDiver WooCommerce plugin).
 */
export interface IECommerceApiConnector {
	/**
	 * Resolved once the peer is ready.
	 * Rejected if the peer does not respond within the timeout.
	 */
	readonly peerIsReady: Promise<ICrossWindowPeerInfo>;
}

/**
 * Factory for creating instances of the cross window e-commerce API.
 */
export interface IECommerceApiFactory {
	/**
	 * Creates an instance of the e-commerce API for the application
	 * consuming the e-commerce functionality (e.g. a configurator).
	 */
	getApplicationApi(
		name: string,
		peerName: string,
		options?: ICrossWindowApiOptions,
	): Promise<IECommerceApi>;

	/**
	 * Creates an instance of the e-commerce API for the connector.
	 * @param window
	 */
	getConnectorApi(
		window: Window,
		actions: IECommerceApiActions,
		name: string,
		peerName: string,
		options?: ICrossWindowApiOptions,
	): Promise<IECommerceApiConnector>;
}
