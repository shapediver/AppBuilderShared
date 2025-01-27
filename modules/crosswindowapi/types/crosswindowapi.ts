export interface ICrossWindowCancelable {
	cancel: () => void;
}

/**
 * Info about a peer window.
 */
export interface ICrossWindowPeerInfo {
	/** The peer window. */
	readonly window?: Window | null;
	/** Origin of the peer window. */
	readonly origin: string;
	/** Name of the peer window. */
	readonly name: string;
}

/**
 * Interface for an API that can be used to communicate between browser windows.
 * Typically this is used to communicate between an iframe and its parent window.
 */
export interface ICrossWindowApi {
	/**
	 * Name identifying the instance.
	 */
	readonly name: string;

	/**
	 * Name identifying the instance of the API in the peer window
	 * which we are communicating with.
	 */
	readonly peerName: string;

	/**
	 * Sends a message to the peer window.
	 * @param type
	 * @param data
	 * @param timeout
	 */
	send<Trequest extends object | undefined, Tresponse>(
		type: string,
		data: Trequest,
		timeout?: number,
	): Promise<Tresponse>;

	/**
	 * Register a handler for a message type.
	 * @param type
	 * @param handler
	 */
	on<Trequest, Tresponse>(
		type: string,
		handler: (data: Trequest) => Promise<Tresponse>,
	): ICrossWindowCancelable;

	/**
	 * Register a one-time handler for a message type.
	 * @param type
	 * @param handler
	 */
	once<Trequest, Tresponse>(
		type: string,
		handler: (data: Trequest) => Promise<Tresponse>,
	): Promise<Trequest>;

	/**
	 * Resolved once the peer is ready.
	 * Rejected if the peer does not respond within the timeout.
	 */
	readonly peerIsReady: Promise<ICrossWindowPeerInfo>;

	/**
	 * Sends a handshake message to the peer window and waits for a response.
	 * In order to succeed, the handshake must be initiated by the peer
	 * using the same type.
	 *
	 * @param type
	 */
	handshake(type: string, timeout?: number): Promise<ICrossWindowPeerInfo>;
}

/**
 * Options for creating a cross window API.
 */
export interface ICrossWindowApiOptions {
	timeout?: number;
	debug?: boolean;
}

/**
 * Factory for creating a cross window API.
 */
export interface ICrossWindowFactory {
	/**
	 * Creates an API for communicating with the parent window.
	 */
	getParentApi(
		name: string,
		peerName: string,
		options?: ICrossWindowApiOptions,
	): Promise<ICrossWindowApi>;

	/**
	 * Creates an API for communicating with the given peer window.
	 * @param window
	 */
	getWindowApi(
		window: Window,
		name: string,
		peerName: string,
		options?: ICrossWindowApiOptions,
	): Promise<ICrossWindowApi>;
}
