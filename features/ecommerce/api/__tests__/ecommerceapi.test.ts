/**
 * @jest-environment jsdom
 */
import {
	ECommerceApi,
	ECommerceApiConnector,
} from "@AppBuilderLib/features/ecommerce/api/ecommerceapi";
import type {
	IECommerceApiActions,
	IECommerceApiConnectorActions,
} from "@AppBuilderLib/features/ecommerce/config/ecommerceapi";
import type {
	ICrossWindowApi,
	ICrossWindowPeerInfo,
} from "@AppBuilderLib/shared/config/crosswindowapi/crosswindowapi";

const MESSAGE_TYPE_ADD_ITEM_TO_CART = "ADD_ITEM_TO_CART";
const MESSAGE_TYPE_CONNECTOR_UPDATE_PARAMETER_VALUES =
	"CONNECTOR_UPDATE_PARAMETER_VALUES";

function createMockCrossWindowApi(options?: {
	handshake?: () => Promise<ICrossWindowPeerInfo>;
}): ICrossWindowApi {
	const handlers = new Map<string, (data: unknown) => Promise<unknown>>();
	const peer: ICrossWindowPeerInfo = {origin: "test", name: "plugin"};
	return {
		name: "app",
		peerName: "plugin",
		peerIsReady: Promise.resolve(peer),
		send: async (type, data) => {
			const handler = handlers.get(type);
			if (!handler) {
				throw new Error(`No handler for ${type}`);
			}
			return handler(data) as never;
		},
		on: (type, handler) => {
			handlers.set(type, handler as (data: unknown) => Promise<unknown>);
			return {
				cancel: () => {
					handlers.delete(type);
				},
			};
		},
		once: async () => {
			throw new Error("once unused in ECommerceApi tests");
		},
		handshake: options?.handshake ?? (async () => peer),
		cancelHandshake: jest.fn(),
	};
}

function stubConnectorActions(
	overrides: Partial<IECommerceApiActions> = {},
): IECommerceApiActions {
	return {
		addItemToCart: async () => ({id: "DUMMY_ID"}),
		getUserProfile: async () => ({id: "DUMMY_ID"}),
		closeConfigurator: async () => false,
		getParentPageInfo: async () => ({href: "http://example.com"}),
		updateSharingLink: async () => ({href: "http://example.com"}),
		scrollingApiSetParameters: async () => ({
			hasNextPage: false,
			items: [],
		}),
		scrollingApiLoadMore: async () => ({hasNextPage: false, items: []}),
		messageToParent: async () => ({}),
		...overrides,
	};
}

function stubAppActions(
	overrides: Partial<IECommerceApiConnectorActions> = {},
): IECommerceApiConnectorActions {
	return {
		updateParameterValues: async () => ({}),
		createModelState: async () => ({}),
		importModelState: async () => ({
			success: false,
			message: "Not implemented",
		}),
		...overrides,
	};
}

describe("ECommerceApiConnector", () => {
	it("registers ADD_ITEM_TO_CART before handshake so an eager client cannot race", async () => {
		let resolveHandshake!: (peer: ICrossWindowPeerInfo) => void;
		const pendingHandshake = new Promise<ICrossWindowPeerInfo>(
			(resolve) => {
				resolveHandshake = resolve;
			},
		);
		const mock = createMockCrossWindowApi({
			handshake: () => pendingHandshake,
		});
		const addItemToCart = jest.fn(async () => ({id: "cart-1"}));
		const connector = new ECommerceApiConnector(
			stubConnectorActions({addItemToCart}),
			mock,
		);

		await expect(
			mock.send(MESSAGE_TYPE_ADD_ITEM_TO_CART, {productId: "p1"}),
		).resolves.toEqual({id: "cart-1"});
		expect(addItemToCart).toHaveBeenCalledWith({productId: "p1"});

		resolveHandshake({origin: "test", name: "app"});
		await connector.peerIsReady;
	});
});

describe("ECommerceApi", () => {
	it("registers connector handlers before handshake so an eager plugin cannot race", async () => {
		let resolveHandshake!: (peer: ICrossWindowPeerInfo) => void;
		const pendingHandshake = new Promise<ICrossWindowPeerInfo>(
			(resolve) => {
				resolveHandshake = resolve;
			},
		);
		const mock = createMockCrossWindowApi({
			handshake: () => pendingHandshake,
		});
		const updateParameterValues = jest.fn(async () => ({}));
		const api = new ECommerceApi(
			stubAppActions({updateParameterValues}),
			mock,
		);

		await expect(
			mock.send(MESSAGE_TYPE_CONNECTOR_UPDATE_PARAMETER_VALUES, {
				state: {session: {p: "1"}},
			}),
		).resolves.toEqual({});
		expect(updateParameterValues).toHaveBeenCalledWith({
			state: {session: {p: "1"}},
		});

		resolveHandshake({origin: "test", name: "plugin"});
		await api.peerIsReady;
	});
});
