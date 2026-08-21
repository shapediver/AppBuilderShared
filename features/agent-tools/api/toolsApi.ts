import {
	ICrossWindowApi,
	ICrossWindowApiOptions,
	ICrossWindowCancelable,
	ICrossWindowFactory,
	ICrossWindowPeerInfo,
} from "@AppBuilderLib/shared/config/crosswindowapi/crosswindowapi";
import {CrossWindowApiFactory} from "@AppBuilderLib/shared/lib/crosswindowapi/crosswindowapi";
import type {ResolvedGenericTool} from "../config/resolveToolset";
import {
	IExecuteToolData,
	IListToolsReply,
	IToolsApi,
	IToolsApiConnector,
	IToolsApiFactory,
	IToolsApiHandlerMap,
	MESSAGE_TYPE_EXECUTE_TOOL,
	MESSAGE_TYPE_LIST_TOOLS,
	MESSAGE_TYPE_TOOLS_API_HANDSHAKE,
	TOOLS_API_NAME_AGENT,
	TOOLS_API_NAME_APP,
	TOOLS_API_TIMEOUT_MS,
} from "../config/toolsApi";
import {
	executeResolvedTool,
	unknownToolResult,
} from "../lib/executeResolvedTool";
import {listToolsFromResolved} from "../lib/listToolsFromResolved";
import {parseExecuteToolData} from "../lib/parseExecuteToolData";

function withDefaultTimeout(
	options?: ICrossWindowApiOptions,
): ICrossWindowApiOptions {
	return {
		timeout: TOOLS_API_TIMEOUT_MS,
		...options,
	};
}

/**
 * Agent-window client. Sends LIST_TOOLS / EXECUTE_TOOL over CrossWindow after
 * handshake `TOOLS_API_HANDSHAKE`. Does not run tool handlers — App Builder does.
 *
 * Construct via {@link ToolsApiFactoryClass.getClientApi} or
 * {@link ToolsApiFactoryClass.getParentClientApi}, not `new ToolsApi` from app code.
 */
export class ToolsApi implements IToolsApi {
	#crossWindowApi: ICrossWindowApi;
	#timeout?: number;
	peerIsReady: Promise<ICrossWindowPeerInfo>;

	constructor(
		crossWindowApi: ICrossWindowApi,
		options?: ICrossWindowApiOptions,
	) {
		this.#crossWindowApi = crossWindowApi;
		this.#timeout = options?.timeout;
		this.peerIsReady = this.#crossWindowApi.handshake(
			MESSAGE_TYPE_TOOLS_API_HANDSHAKE,
			this.#timeout,
		);
	}

	/** Ask App Builder for the resolved generic tools (name, description, JSON Schema). */
	async listTools(): Promise<IListToolsReply> {
		await this.peerIsReady;
		return this.#crossWindowApi.send(
			MESSAGE_TYPE_LIST_TOOLS,
			undefined,
			this.#timeout,
		);
	}

	/**
	 * Run one tool in App Builder. `data.name` must match a listed tool.
	 * Reply is handler JSON; unknown / malformed names return
	 * `{ success: false, message: 'Tool "…" does not exist.' }` instead of throwing.
	 */
	async execute(data: IExecuteToolData): Promise<unknown> {
		await this.peerIsReady;
		return this.#crossWindowApi.send(
			MESSAGE_TYPE_EXECUTE_TOOL,
			data,
			this.#timeout,
		);
	}
}

/**
 * App Builder server. Registers LIST_TOOLS and EXECUTE_TOOL **before** handshake
 * so an eager client cannot race. `cancel()` removes listeners and aborts handshake.
 *
 * LIST_TOOLS → {@link listToolsFromResolved}.
 * EXECUTE_TOOL → {@link parseExecuteToolData} then {@link executeResolvedTool}.
 * Malformed EXECUTE_TOOL (missing string `name`) → unknown-tool JSON, not a throw.
 *
 * Construct via {@link ToolsApiFactoryClass.getConnectorApi}.
 */
export class ToolsApiConnector implements IToolsApiConnector {
	#listenerCancels: ICrossWindowCancelable[] = [];
	#crossWindowApi: ICrossWindowApi;
	peerIsReady: Promise<ICrossWindowPeerInfo>;

	constructor(
		resolvedTools: ResolvedGenericTool[],
		toolHandlers: IToolsApiHandlerMap,
		crossWindowApi: ICrossWindowApi,
		options?: ICrossWindowApiOptions,
	) {
		this.#crossWindowApi = crossWindowApi;
		this.#listenerCancels.push(
			crossWindowApi.on(MESSAGE_TYPE_LIST_TOOLS, async () =>
				listToolsFromResolved(resolvedTools),
			),
		);
		this.#listenerCancels.push(
			crossWindowApi.on(
				MESSAGE_TYPE_EXECUTE_TOOL,
				async (data: IExecuteToolData) => {
					const request = parseExecuteToolData(data);
					if (!request) {
						return unknownToolResult("");
					}
					return executeResolvedTool(
						request.name,
						request.input,
						resolvedTools,
						toolHandlers,
					);
				},
			),
		);
		this.peerIsReady = crossWindowApi.handshake(
			MESSAGE_TYPE_TOOLS_API_HANDSHAKE,
			options?.timeout,
		);
	}

	/** Drop LIST_TOOLS / EXECUTE_TOOL listeners and cancel an in-flight handshake. */
	cancel(): void {
		for (const token of this.#listenerCancels) {
			token.cancel();
		}
		this.#listenerCancels = [];
		this.#crossWindowApi.cancelHandshake();
	}
}

/**
 * Builds {@link ToolsApi} (client) and {@link ToolsApiConnector} (server) on top of
 * {@link CrossWindowApiFactory}. Default timeout {@link TOOLS_API_TIMEOUT_MS}.
 *
 * Name defaults: client methods use this=`"agent"` peer=`"app"`;
 * {@link getConnectorApi} uses this=`"app"` peer=`"agent"`.
 *
 * Pass an explicit peer `Window`. This factory does not `window.open` or guess topology.
 */
export class ToolsApiFactoryClass implements IToolsApiFactory {
	constructor(private readonly crossWindowFactory: ICrossWindowFactory) {}

	private createClientApi(
		crossWindowApi: ICrossWindowApi,
		options: ICrossWindowApiOptions,
	): IToolsApi {
		return new ToolsApi(crossWindowApi, options);
	}

	/**
	 * Client bound to `window` (the App Builder frame that opened us, or the
	 * iframe we are talking to). Default names: `"agent"` → `"app"`.
	 */
	async getClientApi(
		window: Window,
		name = TOOLS_API_NAME_AGENT,
		peerName = TOOLS_API_NAME_APP,
		options?: ICrossWindowApiOptions,
	): Promise<IToolsApi> {
		const optionsWithTimeout = withDefaultTimeout(options);
		const api = await this.crossWindowFactory.getWindowApi(
			window,
			name,
			peerName,
			optionsWithTimeout,
		);
		return this.createClientApi(api, optionsWithTimeout);
	}

	/**
	 * Client bound to `window.parent` (App Builder running as an iframe inside
	 * the host that owns the agent). Default names: `"agent"` → `"app"`.
	 */
	async getParentClientApi(
		name = TOOLS_API_NAME_AGENT,
		peerName = TOOLS_API_NAME_APP,
		options?: ICrossWindowApiOptions,
	): Promise<IToolsApi> {
		const optionsWithTimeout = withDefaultTimeout(options);
		const api = await this.crossWindowFactory.getParentApi(
			name,
			peerName,
			optionsWithTimeout,
		);
		return this.createClientApi(api, optionsWithTimeout);
	}

	/**
	 * Server bound to the agent `window`. Registers listeners, then handshakes.
	 * Default names: `"app"` → `"agent"`.
	 *
	 * `resolvedTools` filters which names exist; `toolHandlers` runs them.
	 * Called from {@link useToolsApiConnector} once snapshot + peer window exist.
	 */
	async getConnectorApi(
		window: Window,
		resolvedTools: ResolvedGenericTool[],
		toolHandlers: IToolsApiHandlerMap,
		name = TOOLS_API_NAME_APP,
		peerName = TOOLS_API_NAME_AGENT,
		options?: ICrossWindowApiOptions,
	): Promise<IToolsApiConnector> {
		const optionsWithTimeout = withDefaultTimeout(options);
		const api = await this.crossWindowFactory.getWindowApi(
			window,
			name,
			peerName,
			optionsWithTimeout,
		);
		return new ToolsApiConnector(
			resolvedTools,
			toolHandlers,
			api,
			optionsWithTimeout,
		);
	}
}

/** Process-wide factory used by App Builder (`useToolsApiConnector`) and by agent clients. */
export const ToolsApiFactory = new ToolsApiFactoryClass(CrossWindowApiFactory);
