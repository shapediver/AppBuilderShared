import type {
	ICrossWindowApiOptions,
	ICrossWindowPeerInfo,
} from "@AppBuilderLib/shared/config/crosswindowapi/crosswindowapi";
import type {InScopeGenericToolName} from "./inScopeGenericTools";
import type {ExecutableSpecificTool} from "./resolveSpecificTools";
import type {ResolvedGenericTool} from "./resolveToolset";
import type {
	IAgentConfigReply,
	IAgentSessionInfo,
	IToolsApiCreateModelStateData,
	IToolsApiCreateModelStateResult,
	IToolsApiImportModelStateData,
	IToolsApiImportModelStateResult,
} from "./toolsApi";

/**
 * Live implementations for every in-scope generic tool name.
 * Same map WebMCP uses. Handlers must not throw: return structured JSON instead.
 */
export type IToolsApiHandlerMap = Record<
	InScopeGenericToolName,
	(input: unknown) => Promise<unknown>
>;

/**
 * Create and import model state for the agent window. Not agent tools.
 * Implementations should reuse the e-commerce store helpers.
 */
export interface IToolsApiModelStateHandlers {
	createModelState(
		data: IToolsApiCreateModelStateData,
	): Promise<IToolsApiCreateModelStateResult>;
	importModelState(
		data: IToolsApiImportModelStateData,
	): Promise<IToolsApiImportModelStateResult>;
}

/**
 * App Builder **server**. Owns LIST_TOOLS / EXECUTE_TOOL / GET_AGENT_CONFIG /
 * GET_SESSION_INFO / CREATE_MODEL_STATE / IMPORT_MODEL_STATE listeners and handshake.
 * Does not expose those methods — the agent calls them on {@link IToolsApi}.
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
 * GET_AGENT_CONFIG / GET_SESSION_INFO / CREATE_MODEL_STATE / IMPORT_MODEL_STATE
 * on an explicit agent `Window`.
 *
 * Default names: this side `"app"`, peer `"agent"`. Timeout 20s unless
 * `options.timeout` overrides.
 *
 * `resolvedGenericTools` is the snapshot from `resolveToolset` (which tools exist).
 * `resolvedSpecificTools` is the snapshot from `resolveSpecificTools`; each tool's
 * `execute` runs it. `toolHandlers` is the live map from `useAgentToolHandlers`.
 * `agentConfig` is parameterized Agent config (`IAppBuilder.agents[0]`); omit /
 * `null` / `undefined` → `getAgentConfig` replies `null`.
 * `sessionInfo` is controller session fields (`jwtToken`, `slug`,
 * `modelStateId`); omit / `null` / `undefined` → `getSessionInfo` replies `{}`.
 * `modelState` runs create/import. Omit → those calls reject.
 * Listeners are attached before handshake starts.
 */
export interface IToolsApiConnectorFactory {
	getConnectorApi(
		window: Window,
		resolvedGenericTools: ResolvedGenericTool[],
		toolHandlers: IToolsApiHandlerMap,
		name?: string,
		peerName?: string,
		options?: ICrossWindowApiOptions,
		agentConfig?: IAgentConfigReply | null,
		sessionInfo?: IAgentSessionInfo | null,
		resolvedSpecificTools?: ExecutableSpecificTool[],
		showThreadHistory?: boolean,
		createThreadOnLoad?: boolean,
		modelState?: IToolsApiModelStateHandlers,
	): Promise<IToolsApiConnector>;
}
