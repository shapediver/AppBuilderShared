import {
	ICrossWindowApi,
	ICrossWindowApiOptions,
	ICrossWindowFactory,
	ICrossWindowPeerInfo,
} from "@AppBuilderLib/shared/config/crosswindowapi/crosswindowapi";
import {CrossWindowApiFactory} from "@AppBuilderLib/shared/lib/crosswindowapi/crosswindowapi";
import {
	IExecuteToolData,
	IListToolsReply,
	IToolsApi,
	IToolsApiFactory,
	MESSAGE_TYPE_CREATE_MODEL_STATE,
	MESSAGE_TYPE_EXECUTE_TOOL,
	MESSAGE_TYPE_GET_AGENT_CONFIG,
	MESSAGE_TYPE_GET_SESSION_INFO,
	MESSAGE_TYPE_IMPORT_MODEL_STATE,
	MESSAGE_TYPE_LIST_TOOLS,
	MESSAGE_TYPE_TOOLS_API_HANDSHAKE,
	TOOLS_API_NAME_AGENT,
	TOOLS_API_NAME_APP,
	TOOLS_API_TIMEOUT_MS,
	type IAgentConfigReply,
	type IAgentSessionInfo,
	type IToolsApiCreateModelStateData,
	type IToolsApiCreateModelStateResult,
	type IToolsApiImportModelStateData,
	type IToolsApiImportModelStateResult,
} from "../config/toolsApi";

function withDefaultTimeout(
	options?: ICrossWindowApiOptions,
): ICrossWindowApiOptions {
	return {
		timeout: TOOLS_API_TIMEOUT_MS,
		...options,
	};
}

/**
 * Agent-window client. Sends LIST_TOOLS / EXECUTE_TOOL / GET_AGENT_CONFIG /
 * GET_SESSION_INFO / CREATE_MODEL_STATE / IMPORT_MODEL_STATE over CrossWindow
 * after handshake `TOOLS_API_HANDSHAKE`. Does not run tool handlers — App Builder
 * does. Model-state calls are not agent tools.
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

	/**
	 * Agent config `{ id, name, message, profileId? }` from App Builder
	 * (`agents[0]`). `null` when agents[] is missing or empty — never a throw.
	 * `profileId` is present only when the agent sets a non-empty one.
	 */
	async getAgentConfig(): Promise<IAgentConfigReply | null> {
		await this.peerIsReady;
		return this.#crossWindowApi.send(
			MESSAGE_TYPE_GET_AGENT_CONFIG,
			undefined,
			this.#timeout,
		);
	}

	/**
	 * Controller session `{ jwtToken, slug, modelStateId }` from App Builder.
	 * Empty object when those fields are missing — never `null` or a throw.
	 */
	async getSessionInfo(): Promise<IAgentSessionInfo> {
		await this.peerIsReady;
		return this.#crossWindowApi.send(
			MESSAGE_TYPE_GET_SESSION_INFO,
			undefined,
			this.#timeout,
		);
	}

	/**
	 * Snapshot the current App Builder model. Same store path as e-commerce
	 * `createModelState`, without listing it as an agent tool.
	 */
	async createModelState(
		data?: IToolsApiCreateModelStateData,
	): Promise<IToolsApiCreateModelStateResult> {
		await this.peerIsReady;
		return this.#crossWindowApi.send(
			MESSAGE_TYPE_CREATE_MODEL_STATE,
			data ?? {},
			this.#timeout,
		);
	}

	/**
	 * Load a previously created model state into the open session. Same store
	 * path as e-commerce `importModelState`.
	 */
	async importModelState(
		data: IToolsApiImportModelStateData,
	): Promise<IToolsApiImportModelStateResult> {
		await this.peerIsReady;
		return this.#crossWindowApi.send(
			MESSAGE_TYPE_IMPORT_MODEL_STATE,
			data,
			this.#timeout,
		);
	}
}

/**
 * Builds {@link ToolsApi} (agent-window client) on top of
 * {@link CrossWindowApiFactory}. Default timeout {@link TOOLS_API_TIMEOUT_MS}.
 *
 * Name defaults: this=`"agent"` peer=`"app"`.
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
}

/** Process-wide factory used by agent clients. */
export const ToolsApiFactory = new ToolsApiFactoryClass(CrossWindowApiFactory);
