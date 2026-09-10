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
	MESSAGE_TYPE_EXECUTE_TOOL,
	MESSAGE_TYPE_GET_AGENT_CONFIG,
	MESSAGE_TYPE_GET_SESSION_INFO,
	MESSAGE_TYPE_LIST_TOOLS,
	MESSAGE_TYPE_TOOLS_API_HANDSHAKE,
	TOOLS_API_NAME_AGENT,
	TOOLS_API_NAME_APP,
	TOOLS_API_TIMEOUT_MS,
	agentConfigReplyFrom,
	agentSessionInfoFrom,
	type IAgentConfigReply,
	type IAgentSessionInfo,
	type IExecuteToolData,
} from "../config/toolsApi";
import type {
	IToolsApiConnector,
	IToolsApiConnectorFactory,
	IToolsApiHandlerMap,
} from "../config/toolsApiConnector";
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
 * App Builder server. Registers LIST_TOOLS, EXECUTE_TOOL, GET_AGENT_CONFIG, and
 * GET_SESSION_INFO **before** handshake so an eager client cannot race.
 * `cancel()` removes listeners and aborts handshake.
 *
 * LIST_TOOLS → {@link listToolsFromResolved}.
 * EXECUTE_TOOL → {@link parseExecuteToolData} then {@link executeResolvedTool}.
 * GET_AGENT_CONFIG → {@link agentConfigReplyFrom} (`null` if no Agent config).
 * GET_SESSION_INFO → {@link agentSessionInfoFrom} (`{}` if no session fields).
 * Malformed EXECUTE_TOOL (missing string `name`) → unknown-tool JSON, not a throw.
 *
 * Construct via {@link ToolsApiConnectorFactoryClass.getConnectorApi}.
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
		agentConfig?: IAgentConfigReply | null,
		sessionInfo?: IAgentSessionInfo | null,
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
		this.#listenerCancels.push(
			crossWindowApi.on(MESSAGE_TYPE_GET_AGENT_CONFIG, async () =>
				agentConfigReplyFrom(agentConfig),
			),
		);
		this.#listenerCancels.push(
			crossWindowApi.on(MESSAGE_TYPE_GET_SESSION_INFO, async () =>
				agentSessionInfoFrom(sessionInfo),
			),
		);
		this.peerIsReady = crossWindowApi.handshake(
			MESSAGE_TYPE_TOOLS_API_HANDSHAKE,
			options?.timeout,
		);
	}

	/** Drop LIST_TOOLS / EXECUTE_TOOL / GET_AGENT_CONFIG / GET_SESSION_INFO listeners and cancel an in-flight handshake. */
	cancel(): void {
		for (const token of this.#listenerCancels) {
			token.cancel();
		}
		this.#listenerCancels = [];
		this.#crossWindowApi.cancelHandshake();
	}
}

/**
 * Builds {@link ToolsApiConnector} (App Builder server) on top of
 * {@link CrossWindowApiFactory}. Default timeout {@link TOOLS_API_TIMEOUT_MS}.
 *
 * Name defaults: this=`"app"` peer=`"agent"`.
 *
 * Pass an explicit peer `Window`. This factory does not `window.open` or guess topology.
 */
export class ToolsApiConnectorFactoryClass implements IToolsApiConnectorFactory {
	constructor(private readonly crossWindowFactory: ICrossWindowFactory) {}

	/**
	 * Server bound to the agent `window`. Registers listeners, then handshakes.
	 * Default names: `"app"` → `"agent"`.
	 *
	 * `resolvedTools` filters which names exist; `toolHandlers` runs them.
	 * `agentConfig` is `IAppBuilder.agents[0]` (parameterized).
	 * `sessionInfo` is controller session fields for `getSessionInfo`.
	 * Called from {@link useToolsApiConnector} once snapshot + peer window exist.
	 */
	async getConnectorApi(
		window: Window,
		resolvedTools: ResolvedGenericTool[],
		toolHandlers: IToolsApiHandlerMap,
		name = TOOLS_API_NAME_APP,
		peerName = TOOLS_API_NAME_AGENT,
		options?: ICrossWindowApiOptions,
		agentConfig?: IAgentConfigReply | null,
		sessionInfo?: IAgentSessionInfo | null,
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
			agentConfig,
			sessionInfo,
		);
	}
}

/** Process-wide factory used by App Builder (`useToolsApiConnector`). */
export const ToolsApiConnectorFactory = new ToolsApiConnectorFactoryClass(
	CrossWindowApiFactory,
);
