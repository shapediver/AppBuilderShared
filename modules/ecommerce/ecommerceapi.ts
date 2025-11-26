import {CrossWindowApiFactory} from "@AppBuilderShared/modules/crosswindowapi/crosswindowapi";
import {
	ICrossWindowApi,
	ICrossWindowApiOptions,
	ICrossWindowFactory,
	ICrossWindowPeerInfo,
} from "@AppBuilderShared/modules/crosswindowapi/types/crosswindowapi";
import {
	IAddItemToCartData,
	IAddItemToCartReply,
	IECommerceApi,
	IECommerceApiActions,
	IECommerceApiConnector,
	IECommerceApiFactory,
	IGetParentPageInfoReply,
	IGetUserProfileReply,
	IScrollingApiLoadMoreData,
	IScrollingApiLoadMoreReply,
	IScrollingApiSetParametersData,
	IScrollingApiSetParametersReply,
	IUpdateSharingLinkData,
	IUpdateSharingLinkReply,
} from "@AppBuilderShared/modules/ecommerce/types/ecommerceapi";
import {applyModelStateToUrl} from "@AppBuilderShared/utils/modifyUrl";

// Message types for the API calls.
// CAUTION: When implementing new API calls and messages type, make sure to add
// the corresponding listener in the ECommerceApiConnector constructor.

const MESSAGE_TYPE_ADD_ITEM_TO_CART = "ADD_ITEM_TO_CART";
const MESSAGE_TYPE_GET_USER_PROFILE = "GET_USER_PROFILE";
const MESSAGE_TYPE_CLOSE_CONFIGURATOR = "CLOSE_CONFIGURATOR";
const MESSAGE_TYPE_GET_PARENT_PAGE_INFO = "GET_PARENT_PAGE_INFO";
const MESSAGE_TYPE_UPDATE_SHARING_LINK = "UPDATE_SHARING_LINK";
const MESSAGE_TYPE_SCROLLINGAPI_SET_PARAMETERS = "SCROLLINGAPI_SET_PARAMETERS";
const MESSAGE_TYPE_SCROLLINGAPI_LOAD_MORE = "SCROLLINGAPI_LOAD_MORE";
const MESSAGE_TYPE_HANDSHAKE = "HANDSHAKE";

export class ECommerceApi implements IECommerceApi {
	/**
	 * The cross window API instance to use for communication
	 * with the e-commerce plugin.
	 */
	crossWindowApi: ICrossWindowApi;

	/**
	 * Timeout for the API calls.
	 */
	timeout?: number;

	debug: boolean;

	constructor(
		crossWindowApi: ICrossWindowApi,
		options?: ICrossWindowApiOptions,
	) {
		this.crossWindowApi = crossWindowApi;
		this.debug = options?.debug ?? false;
		this.timeout = options?.timeout;
		this.peerIsReady = this.crossWindowApi.handshake(
			MESSAGE_TYPE_HANDSHAKE,
			this.timeout,
		);
	}

	async closeConfigurator(): Promise<boolean> {
		await this.peerIsReady;

		return this.crossWindowApi.send(
			MESSAGE_TYPE_CLOSE_CONFIGURATOR,
			undefined,
			this.timeout,
		);
	}

	async addItemToCart(
		data: IAddItemToCartData,
	): Promise<IAddItemToCartReply> {
		await this.peerIsReady;

		return this.crossWindowApi.send(
			MESSAGE_TYPE_ADD_ITEM_TO_CART,
			data,
			this.timeout,
		);
	}

	async getUserProfile(): Promise<IGetUserProfileReply> {
		await this.peerIsReady;

		return this.crossWindowApi.send(
			MESSAGE_TYPE_GET_USER_PROFILE,
			undefined,
			this.timeout,
		);
	}

	async getParentPageInfo(): Promise<IGetParentPageInfoReply> {
		await this.peerIsReady;

		return this.crossWindowApi.send(
			MESSAGE_TYPE_GET_PARENT_PAGE_INFO,
			undefined,
			this.timeout,
		);
	}

	async updateSharingLink(
		data: IUpdateSharingLinkData,
	): Promise<IUpdateSharingLinkReply> {
		await this.peerIsReady;

		return this.crossWindowApi.send(
			MESSAGE_TYPE_UPDATE_SHARING_LINK,
			data,
			this.timeout,
		);
	}

	async scrollingApiSetParameters(
		data: IScrollingApiSetParametersData,
	): Promise<IScrollingApiSetParametersReply<unknown>> {
		await this.peerIsReady;

		return this.crossWindowApi.send(
			MESSAGE_TYPE_SCROLLINGAPI_SET_PARAMETERS,
			data,
			this.timeout,
		);
	}

	async scrollingApiLoadMore(
		data: IScrollingApiLoadMoreData,
	): Promise<IScrollingApiLoadMoreReply<unknown>> {
		await this.peerIsReady;

		return this.crossWindowApi.send(
			MESSAGE_TYPE_SCROLLINGAPI_LOAD_MORE,
			data,
			this.timeout,
		);
	}

	peerIsReady: Promise<ICrossWindowPeerInfo>;
}

export class ECommerceApiConnector implements IECommerceApiConnector {
	peerIsReady: Promise<ICrossWindowPeerInfo>;

	/**
	 * Implementation of the API actions.
	 */
	actions: IECommerceApiActions;

	/**
	 * The cross window API instance to use for communication
	 * with the application using the e-commerce API.
	 */
	crossWindowApi: ICrossWindowApi;

	/**
	 * Timeout for the API calls.
	 */
	timeout?: number;

	debug: boolean;

	constructor(
		actions: IECommerceApiActions,
		crossWindowApi: ICrossWindowApi,
		options?: ICrossWindowApiOptions,
	) {
		this.actions = actions;
		this.crossWindowApi = crossWindowApi;
		this.debug = options?.debug ?? false;
		this.timeout = options?.timeout;
		this.peerIsReady = this.crossWindowApi
			.handshake(MESSAGE_TYPE_HANDSHAKE, this.timeout)
			.then((peerInfo) => {
				this.crossWindowApi.on(
					MESSAGE_TYPE_ADD_ITEM_TO_CART,
					(data: IAddItemToCartData) =>
						this.actions.addItemToCart(data),
				);
				this.crossWindowApi.on(MESSAGE_TYPE_GET_USER_PROFILE, () =>
					this.actions.getUserProfile(),
				);
				this.crossWindowApi.on(MESSAGE_TYPE_CLOSE_CONFIGURATOR, () =>
					this.actions.closeConfigurator(),
				);
				this.crossWindowApi.on(MESSAGE_TYPE_GET_PARENT_PAGE_INFO, () =>
					this.actions.getParentPageInfo(),
				);
				this.crossWindowApi.on(
					MESSAGE_TYPE_UPDATE_SHARING_LINK,
					(data: IUpdateSharingLinkData) =>
						this.actions.updateSharingLink(data),
				);
				this.crossWindowApi.on(
					MESSAGE_TYPE_SCROLLINGAPI_SET_PARAMETERS,
					(data: IScrollingApiSetParametersData) =>
						this.actions.scrollingApiSetParameters(data),
				);
				this.crossWindowApi.on(
					MESSAGE_TYPE_SCROLLINGAPI_LOAD_MORE,
					(data: IScrollingApiLoadMoreData) =>
						this.actions.scrollingApiLoadMore(data),
				);

				return peerInfo;
			});
	}
}

export class DummyECommerceApiActions implements IECommerceApiActions {
	getParentPageInfo(): Promise<IGetParentPageInfoReply> {
		return Promise.resolve({href: window.location.href});
	}

	closeConfigurator(): Promise<boolean> {
		return Promise.resolve(false);
	}

	addItemToCart(/*data: IAddItemToCartDat*/): Promise<IAddItemToCartReply> {
		const reply: IAddItemToCartReply = {
			id: "DUMMY_ID",
		};

		return Promise.reject(reply);
	}

	getUserProfile(): Promise<IGetUserProfileReply> {
		const reply: IGetUserProfileReply = {
			id: "DUMMY_ID",
			email: "john@doe.com",
			name: "John Doe",
		};

		return Promise.resolve(reply);
	}

	updateSharingLink({
		modelStateId,
		updateUrl,
	}: IUpdateSharingLinkData): Promise<IUpdateSharingLinkReply> {
		const url = applyModelStateToUrl(modelStateId, updateUrl);
		return Promise.resolve({href: url.toString()});
	}

	scrollingApiSetParameters<
		TItem,
	>(/*data: IScrollingApiSetParametersData,*/): Promise<
		IScrollingApiSetParametersReply<TItem>
	> {
		return Promise.resolve({hasNextPage: false, items: []});
	}

	scrollingApiLoadMore<TItem>(/*data: IScrollingApiLoadMoreData,*/): Promise<
		IScrollingApiLoadMoreReply<TItem>
	> {
		return Promise.resolve({hasNextPage: false, items: []});
	}
}

export class DummyECommerceApi implements IECommerceApi {
	peerIsReady: Promise<ICrossWindowPeerInfo>;

	actions: IECommerceApiActions;

	constructor() {
		this.peerIsReady = Promise.resolve({origin: "dummy", name: "dummy"});
		this.actions = new DummyECommerceApiActions();
	}

	updateSharingLink(
		data: IUpdateSharingLinkData,
	): Promise<IUpdateSharingLinkReply> {
		return this.actions.updateSharingLink(data);
	}

	getParentPageInfo(): Promise<IGetParentPageInfoReply> {
		return this.actions.getParentPageInfo();
	}

	addItemToCart(data: IAddItemToCartData): Promise<IAddItemToCartReply> {
		return this.actions.addItemToCart(data);
	}

	getUserProfile(): Promise<IGetUserProfileReply> {
		return this.actions.getUserProfile();
	}

	closeConfigurator(): Promise<boolean> {
		return this.actions.closeConfigurator();
	}

	scrollingApiSetParameters(
		data: IScrollingApiSetParametersData,
	): Promise<IScrollingApiSetParametersReply<unknown>> {
		return this.actions.scrollingApiSetParameters(data);
	}

	scrollingApiLoadMore(
		data: IScrollingApiLoadMoreData,
	): Promise<IScrollingApiLoadMoreReply<unknown>> {
		return this.actions.scrollingApiLoadMore(data);
	}
}

class _ECommerceApiFactory implements IECommerceApiFactory {
	crossWindowFactory: ICrossWindowFactory;

	constructor(crossWindowFactory: ICrossWindowFactory) {
		this.crossWindowFactory = crossWindowFactory;
	}

	async getApplicationApi(
		name: string,
		peerName: string,
		options?: ICrossWindowApiOptions,
	): Promise<IECommerceApi> {
		const api = await this.crossWindowFactory.getParentApi(
			name,
			peerName,
			options,
		);

		return new ECommerceApi(api, options);
	}

	async getConnectorApi(
		window: Window,
		actions: IECommerceApiActions,
		name: string,
		peerName: string,
		options?: ICrossWindowApiOptions,
	): Promise<IECommerceApiConnector> {
		const api = await this.crossWindowFactory.getWindowApi(
			window,
			name,
			peerName,
			options,
		);

		return new ECommerceApiConnector(actions, api, options);
	}
}

export const ECommerceApiFactory = new _ECommerceApiFactory(
	CrossWindowApiFactory,
);
