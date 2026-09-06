import type {
	ICrossWindowApiOptions,
	ICrossWindowPeerInfo,
} from "@AppBuilderLib/shared/config/crosswindowapi/crosswindowapi";
import type {InScopeGenericToolName} from "./inScopeGenericTools";
import type {ResolvedGenericTool} from "./resolveToolset";
import type {IAgentConfigReply, IAgentSessionInfo} from "./toolsApi";

/**
 * Live implementations for every in-scope generic tool name.
 * Same map WebMCP uses. Handlers must not throw: return structured JSON instead.
 */
export type IToolsApiHandlerMap = Record<
	InScopeGenericToolName,
	(input: unknown) => Promise<unknown>
>;

/**
 * App Builder **server**. Owns LIST_TOOLS / EXECUTE_TOOL / GET_AGENT_CONFIG /
 * GET_SESSION_INFO listeners and handshake.
 * Does not expose list/execute/getAgentConfig/getSessionInfo methods — the agent
 * calls those on {@link IToolsApi}.
 *
 * `cancel()` tears down listeners and the handshake. Required on React unmount
 * and when `getConnectorApi` resolves after the effect was already cleaned up.
 */
export interface IToolsApiConnector {
	readonly peerIsReady: Promise<ICrossWindowPeerInfo>;
	cancel(): void;
}

/**
 * App Builder **server** factory. Registers LIST_TOOLS / EXECUTE_TOOL /
 * GET_AGENT_CONFIG / GET_SESSION_INFO on an explicit agent `Window`.
 *
 * Default names: this side `"app"`, peer `"agent"`. Timeout 20s unless
 * `options.timeout` overrides.
 *
 * `resolvedTools` is the snapshot from `resolveToolset` (which tools exist).
 * `toolHandlers` is the live map from `useAgentToolHandlers` (how they run).
 * `agentConfig` is parameterized Agent config (`IAppBuilder.agents[0]`); omit /
 * `null` / `undefined` → `getAgentConfig` replies `null`.
 * `sessionInfo` is controller session fields (`jwtToken`, `slug`,
 * `modelStateId`); omit / `null` / `undefined` → `getSessionInfo` replies `{}`.
 * Listeners are attached before handshake starts.
 */
export interface IToolsApiConnectorFactory {
	getConnectorApi(
		window: Window,
		resolvedTools: ResolvedGenericTool[],
		toolHandlers: IToolsApiHandlerMap,
		name?: string,
		peerName?: string,
		options?: ICrossWindowApiOptions,
		agentConfig?: IAgentConfigReply | null,
		sessionInfo?: IAgentSessionInfo | null,
	): Promise<IToolsApiConnector>;
}
