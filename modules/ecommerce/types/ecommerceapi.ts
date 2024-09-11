import { ICrossWindowApiOptions, ICrossWindowPeerInfo } from "../../crosswindowapi/types/crosswindowapi";


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
    productId?: string
    
    /** Quantity of the line item to add to the cart (number of units). Optional, defaults to 1. */
    quantity?: number

    /**
     * The custom price of the cart (line) item to be added.
     */
    price?: number

    /**
     * The description of the cart (line) item to be added.
     */
    description?: string

    /**
     * The id of the ShapeDiver model state that should be linked to the cart item.
     */
    modelStateId?: string
}

export interface IAddItemToCartReply {
    /**
     * The id of the cart item that has been added.
     */
    id: string
}


/**
 * Profile data of the current user, if any.
 */
export interface IGetUserProfileReply {
    id: string
    email?: string
    name?: string
}

/**
 * Generic e-commerce API actions.
 */
export interface IECommerceApiActions {

    /**
     * Add an item to the cart.
     * @param data 
     */
    addItemToCart(data: IAddItemToCartData): Promise<IAddItemToCartReply>

    /**
     * Get the user profile.
     */
    getUserProfile(): Promise<IGetUserProfileReply>

    /**
     * Close the configurator modal / window.
     * @returns true if the configurator was closed successfully, false otherwise.
     */
    closeConfigurator(): Promise<boolean>
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
	readonly peerIsReady: Promise<ICrossWindowPeerInfo>

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
	readonly peerIsReady: Promise<ICrossWindowPeerInfo>

}

/**
 * Factory for creating instances of the cross window e-commerce API.
 */
export interface IECommerceApiFactory {

	/**
	 * Creates an instance of the e-commerce API for the application 
     * consuming the e-commerce functionality (e.g. a configurator). 
	 */
	getApplicationApi(name: string, peerName: string, options?: ICrossWindowApiOptions): Promise<IECommerceApi>

	/**
	 * Creates an instance of the e-commerce API for the connector.
	 * @param window 
	 */
	getConnectorApi(window: Window, actions: IECommerceApiActions, name: string, peerName: string, options?: ICrossWindowApiOptions): Promise<IECommerceApiConnector>

}
