import {
	ICrossWindowApi,
	ICrossWindowApiOptions,
	ICrossWindowCancelable,
	ICrossWindowFactory,
	ICrossWindowPeerInfo,
} from "@AppBuilderShared/modules/crosswindowapi/types/crosswindowapi";
import postRobot from "post-robot";

type CrossDomainWindowType = Window | null;
type HandlerType = (event: {
	source: CrossDomainWindowType;
	origin: string;
	data: any;
}) => Promise<any>;

const MESSAGE_TYPE_READY = "API_READY";

/**
 * The interval in which the peer is notified that we are ready.
 * The shorter the interval, the faster the communication is established (but more messages are sent).
 */
const SETUP_INTERVAL = 100;

class CrossWindowApi implements ICrossWindowApi {
	private window: Window;
	private debug: boolean;
	private timeout?: number;
	public name: string;
	public peerName: string;
	public peerIsReady: Promise<ICrossWindowPeerInfo>;

	constructor(
		window: Window,
		name: string,
		peerName: string,
		options?: ICrossWindowApiOptions,
	) {
		if (window === globalThis.window) {
			const msg =
				"Cannot create an API for self (window === global.window)";
			this.log(msg);
			throw new Error(msg);
		}

		this.window = window;
		this.debug = options?.debug ?? false;
		this.timeout = options?.timeout;
		this.name = name;
		this.peerName = peerName;

		// notify the peer that we are ready, do this until
		// we get a response
		const intervalId = setInterval(async () => {
			try {
				const result = await postRobot.send(
					window,
					`${this.name}${MESSAGE_TYPE_READY}`,
					{name},
					{timeout: SETUP_INTERVAL},
				);
				this.log("Peer answered ready event", result);
				clearInterval(intervalId);
			} catch {
				//(error)
				//this.log("Peer not ready", error);
			}
		}, SETUP_INTERVAL);

		// wait until the peer is ready
		this.peerIsReady = new Promise<ICrossWindowPeerInfo>(
			(resolve, reject) => {
				const timeoutId = this.timeout
					? setTimeout(() => {
							const msg = `Peer did not respond within ${this.timeout}ms, giving up`;
							this.log(msg);
							token.cancel();
							clearInterval(intervalId);
							reject(new Error(msg));
						}, this.timeout)
					: undefined;

				const token = postRobot.on(
					`${this.peerName}${MESSAGE_TYPE_READY}`,
					{window},
					async (event) => {
						if (event.data.name !== this.peerName) {
							const msg = `Peer ready event: name mismatch: ${event.data.name} !== ${this.peerName}`;
							this.log(msg);
							throw new Error(msg);
						}
						this.log("Peer ready event received", event);
						clearTimeout(timeoutId);
						token.cancel();
						resolve({
							window: event.source,
							origin: event.origin,
							name: event.data.name as unknown as string,
						});

						return {name: this.name};
					},
				);
			},
		);
	}

	handshake(type: string, timeout?: number): Promise<ICrossWindowPeerInfo> {
		// send a handshake message to the peer
		// do this regularly until we get a response
		const intervalId = setInterval(async () => {
			try {
				await this.send(type, undefined);
				this.log(`Handshake "${type}" successfully sent`);
				clearInterval(intervalId);
			} catch {
				// ignore
			}
		}, SETUP_INTERVAL);

		// wait until we receive a handshake message from the peer
		return new Promise<ICrossWindowPeerInfo>((resolve, reject) => {
			const timeoutId = timeout
				? setTimeout(() => {
						const msg = `Peer did not respond to handshake "${type}" within ${timeout}ms, giving up`;
						this.log(msg);
						token.cancel();
						clearInterval(intervalId);
						reject(new Error(msg));
					}, timeout)
				: undefined;

			const token = this.on(type, async () => {
				this.log(`Handshake "${type}" successfully received`);
				clearTimeout(timeoutId);
				token.cancel();
				resolve(this.peerIsReady);
			});
		});
	}

	log(...message: any[]): void {
		if (this.debug)
			console.log(
				`CrossWindowApi (name = "${this.name}", peerName = "${this.peerName}"):`,
				...message,
			);
	}

	async once<Trequest, Tresponse>(
		type: string,
		_handler: (data: Trequest) => Promise<Tresponse>,
	): Promise<Trequest> {
		await this.peerIsReady;
		const handler: HandlerType = (event) =>
			_handler(event.data as Trequest);
		const requestEvent = await postRobot.once(`${this.peerName}:${type}`, {
			handler,
			window: this.window,
		});

		return requestEvent.data as Trequest;
	}

	on<Trequest, Tresponse>(
		type: string,
		_handler: (data: Trequest) => Promise<Tresponse>,
	): ICrossWindowCancelable {
		const handler: HandlerType = (event) =>
			_handler(event.data as Trequest);

		return postRobot.on(`${this.peerName}:${type}`, {
			handler,
			window: this.window,
		});
	}

	async send<Trequest extends object | undefined, Tresponse>(
		type: string,
		data: Trequest,
		timeout?: number,
	): Promise<Tresponse> {
		await this.peerIsReady;

		return postRobot
			.send(this.window, `${this.name}:${type}`, data, {
				timeout: timeout ?? this.timeout,
			})
			.then((response) => {
				return response.data as Tresponse;
			});
	}
}

class _CrossWindowApiFactory implements ICrossWindowFactory {
	async getParentApi(
		name: string,
		peerName: string,
		options?: ICrossWindowApiOptions,
	): Promise<ICrossWindowApi> {
		return this.getWindowApi(window.parent, name, peerName, options);
	}

	async getWindowApi(
		window: Window,
		name: string,
		peerName: string,
		options?: ICrossWindowApiOptions,
	): Promise<ICrossWindowApi> {
		const api = new CrossWindowApi(window, name, peerName, options);
		await api.peerIsReady;

		return api;
	}
}

export const CrossWindowApiFactory = new _CrossWindowApiFactory();
