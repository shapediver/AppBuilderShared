import type {
	ICrossWindowApiOptions,
	ICrossWindowPeerInfo,
} from "@AppBuilderLib/shared/config/crosswindowapi/crosswindowapi";
import type {JsonSchema} from "../lib/zodToJsonSchema";
import type {InScopeGenericToolName} from "./inScopeGenericTools";
import type {ResolvedGenericTool} from "./resolveToolset";

/**
 * CrossWindow message type: agent asks App Builder which tools exist.
 * Payload is unused. Reply is {@link IListToolsReply}.
 */
export const MESSAGE_TYPE_LIST_TOOLS = "LIST_TOOLS";

/**
 * CrossWindow message type: agent asks App Builder to run one tool.
 * Payload is {@link IExecuteToolData}. Reply is the handler JSON (never a throw).
 */
export const MESSAGE_TYPE_EXECUTE_TOOL = "EXECUTE_TOOL";

/**
 * CrossWindow handshake name for ToolsApi (same role as ECommerce's ready handshake).
 * Listeners for LIST_TOOLS / EXECUTE_TOOL must be registered **before** this runs,
 * or the agent can send into a window that is not listening yet.
 */
export const MESSAGE_TYPE_TOOLS_API_HANDSHAKE = "TOOLS_API_HANDSHAKE";

/** CrossWindow `name` of the App Builder side (server / connector). */
export const TOOLS_API_NAME_APP = "tools_app";

/** CrossWindow `name` of the agent side (client). */
export const TOOLS_API_NAME_AGENT = "tools_agent";

/** Default CrossWindow timeout for handshake and request/reply (ms). */
export const TOOLS_API_TIMEOUT_MS = 20000;

/**
 * Live implementations for every in-scope generic tool name.
 * Same map WebMCP uses. Handlers must not throw: return structured JSON instead.
 */
export type IToolsApiHandlerMap = Record<
	InScopeGenericToolName,
	(input: unknown) => Promise<unknown>
>;

/** One tool as advertised by `listTools()` (schema-only; execution stays in App Builder). */
export interface IListToolsTool {
	name: string;
	description: string;
	inputSchema: JsonSchema;
}

export interface IListToolsReply {
	tools: IListToolsTool[];
}

/** Body of EXECUTE_TOOL. `name` is a resolved generic tool name (snake_case). */
export interface IExecuteToolData {
	name: string;
	input: unknown;
}

/**
 * Agent-window **client**. Lives in the peer that does **not** run tool handlers.
 *
 * Obtained via {@link IToolsApiFactory.getClientApi} (peer `Window`) or
 * {@link IToolsApiFactory.getParentClientApi} (`window.parent`).
 *
 * Await `peerIsReady` (or let `listTools` / `execute` await it) before assuming
 * App Builder is listening.
 */
export interface IToolsApi {
	readonly peerIsReady: Promise<ICrossWindowPeerInfo>;
	listTools(): Promise<IListToolsReply>;
	execute(data: IExecuteToolData): Promise<unknown>;
}

/**
 * App Builder **server**. Owns LIST_TOOLS / EXECUTE_TOOL listeners and handshake.
 * Does not expose list/execute methods — the agent calls those on {@link IToolsApi}.
 *
 * `cancel()` tears down listeners and the handshake. Required on React unmount
 * and when `getConnectorApi` resolves after the effect was already cleaned up.
 */
export interface IToolsApiConnector {
	readonly peerIsReady: Promise<ICrossWindowPeerInfo>;
	cancel(): void;
}

/**
 * Factory for both sides of ToolsApi. Same CrossWindow pattern as ECommerce,
 * roles inverted: App Builder is the server, the agent window is the client.
 *
 * Default names: connector = `"app"`, client = `"agent"`. Timeout 20s unless
 * `options.timeout` overrides.
 *
 * Topology is **not** auto-detected. The caller passes the peer `Window`:
 * - App Builder `window.open` agent → connector gets the opened window; client uses `opener`
 * - Agent iframe inside App Builder → connector gets `iframe.contentWindow`
 * - App Builder iframe inside host agent → connector / client via `parent` as appropriate
 */
export interface IToolsApiFactory {
	/**
	 * Client in the agent window, talking to an explicit App Builder `Window`.
	 * Default names: this side `"agent"`, peer `"app"`.
	 */
	getClientApi(
		window: Window,
		name?: string,
		peerName?: string,
		options?: ICrossWindowApiOptions,
	): Promise<IToolsApi>;
	/**
	 * Client that talks to `window.parent` (App Builder iframe inside a host agent).
	 * Default names: this side `"agent"`, peer `"app"`.
	 */
	getParentClientApi(
		name?: string,
		peerName?: string,
		options?: ICrossWindowApiOptions,
	): Promise<IToolsApi>;
	/**
	 * Server in App Builder, talking to an explicit agent `Window`.
	 * Default names: this side `"app"`, peer `"agent"`.
	 *
	 * `resolvedTools` is the snapshot from `resolveToolset` (which tools exist).
	 * `toolHandlers` is the live map from `useAgentToolHandlers` (how they run).
	 * Listeners are attached before handshake starts.
	 */
	getConnectorApi(
		window: Window,
		resolvedTools: ResolvedGenericTool[],
		toolHandlers: IToolsApiHandlerMap,
		name?: string,
		peerName?: string,
		options?: ICrossWindowApiOptions,
	): Promise<IToolsApiConnector>;
}
