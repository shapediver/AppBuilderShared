import type {
	ICrossWindowApiOptions,
	ICrossWindowPeerInfo,
} from "@AppBuilderLib/shared/config/crosswindowapi/crosswindowapi";
import type {
	IModelStateWireCreateData,
	IModelStateWireCreateResult,
	IModelStateWireImportData,
	IModelStateWireImportResult,
} from "../../model-state/config/modelStateWire";
import type {JsonSchema} from "../lib/zodToJsonSchema";

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
 * CrossWindow message type: agent asks App Builder for Agent config prompt fields.
 * Payload is unused. Reply is {@link IAgentConfigReply} or `null` when agents[] is
 * missing/empty. Never throws across the wire.
 */
export const MESSAGE_TYPE_GET_AGENT_CONFIG = "GET_AGENT_CONFIG";

/**
 * CrossWindow message type: agent asks App Builder for controller session fields
 * used to authenticate (`jwtToken`) and identify the model (`slug`, `modelStateId`).
 * Payload is unused. Reply is {@link IAgentSessionInfo} (never `null`).
 */
export const MESSAGE_TYPE_GET_SESSION_INFO = "GET_SESSION_INFO";

/**
 * CrossWindow message type: agent asks App Builder to snapshot the current model.
 * Not an agent tool — omitted from `listTools`. Payload is
 * {@link IToolsApiCreateModelStateData}. Reply is {@link IToolsApiCreateModelStateResult}.
 */
export const MESSAGE_TYPE_CREATE_MODEL_STATE = "CREATE_MODEL_STATE";

/**
 * CrossWindow message type: agent asks App Builder to load a saved model state.
 * Not an agent tool — omitted from `listTools`. Payload is
 * {@link IToolsApiImportModelStateData}. Reply is {@link IToolsApiImportModelStateResult}.
 */
export const MESSAGE_TYPE_IMPORT_MODEL_STATE = "IMPORT_MODEL_STATE";

/**
 * CrossWindow handshake name for ToolsApi (same role as ECommerce's ready handshake).
 * Listeners for LIST_TOOLS / EXECUTE_TOOL / GET_AGENT_CONFIG / GET_SESSION_INFO /
 * CREATE_MODEL_STATE / IMPORT_MODEL_STATE must be registered **before** this runs,
 * or the agent can send into a window that is not listening yet.
 */
export const MESSAGE_TYPE_TOOLS_API_HANDSHAKE = "TOOLS_API_HANDSHAKE";

/** CrossWindow `name` of the App Builder side (server / connector). */
export const TOOLS_API_NAME_APP = "tools_app";

/** CrossWindow `name` of the agent side (client). */
export const TOOLS_API_NAME_AGENT = "tools_agent";

/** Default CrossWindow timeout for handshake and request/reply (ms). */
export const TOOLS_API_TIMEOUT_MS = 20000;

/** One tool as advertised by `listTools()` (schema-only; execution stays in App Builder). */
export interface IListToolsTool {
	name: string;
	description: string;
	inputSchema: JsonSchema;
}

export interface IListToolsReply {
	tools: IListToolsTool[];
}

/** Body of EXECUTE_TOOL. `name` is a resolved generic or specific tool name (snake_case). */
export interface IExecuteToolData {
	name: string;
	input: unknown;
}

/**
 * Agent config fields ToolsApi exposes after handshake.
 * Subset of `IAppBuilderAgent` — never the full object (`genericTools` /
 * `specificTools` stay in App Builder).
 */
export interface IAgentConfigReply {
	id: string;
	name: string;
	message: string;
	/**
	 * Resolved AgentUi history flag. Older hosts omit it; the agent then keeps
	 * the history sidebar.
	 */
	showThreadHistory?: boolean;
	/**
	 * Resolved AgentUi load flag. Older hosts omit it; the agent then resumes
	 * the latest thread when one exists.
	 */
	createThreadOnLoad?: boolean;
}

/**
 * `{ id, name, message }` from parameterized Agent config, or `null` when
 * `agents[]` is missing/empty. Strips other `IAppBuilderAgent` fields.
 * History and load flags are resolved AgentUi values, not fields of the agent.
 */
export function agentConfigReplyFrom(
	agent: IAgentConfigReply | null | undefined,
	showThreadHistory?: boolean,
	createThreadOnLoad?: boolean,
): IAgentConfigReply | null {
	if (agent == null) {
		return null;
	}
	const reply: IAgentConfigReply = {
		id: agent.id,
		name: agent.name,
		message: agent.message,
	};
	if (typeof showThreadHistory === "boolean") {
		reply.showThreadHistory = showThreadHistory;
	}
	if (typeof createThreadOnLoad === "boolean") {
		reply.createThreadOnLoad = createThreadOnLoad;
	}
	return reply;
}

/**
 * Controller session fields ToolsApi exposes after handshake.
 * Sourced from the App Builder session DTO, not from `IAppBuilder.agents[0]`.
 * All fields optional: ticket-only sessions omit `jwtToken` (and often `slug`).
 */
export interface IAgentSessionInfo {
	jwtToken?: string;
	slug?: string;
	modelStateId?: string;
}

/**
 * `{ jwtToken, slug, modelStateId }` from the controller session, omitting empty
 * or missing fields. `null` / `undefined` → `{}`. Never returns `null`.
 */
export function agentSessionInfoFrom(
	session: IAgentSessionInfo | null | undefined,
): IAgentSessionInfo {
	if (session == null) {
		return {};
	}
	const result: IAgentSessionInfo = {};
	if (session.jwtToken) {
		result.jwtToken = session.jwtToken;
	}
	if (session.slug) {
		result.slug = session.slug;
	}
	if (session.modelStateId) {
		result.modelStateId = session.modelStateId;
	}
	return result;
}

/** Create-model-state payload sent across ToolsApi. */
export type IToolsApiCreateModelStateData = IModelStateWireCreateData;

/** Reply from {@link IToolsApi.createModelState}. `modelStateId` is absent when no session is open. */
export type IToolsApiCreateModelStateResult = IModelStateWireCreateResult;

/** Payload for {@link IToolsApi.importModelState}. */
export type IToolsApiImportModelStateData = IModelStateWireImportData;

/** Reply from {@link IToolsApi.importModelState}. */
export type IToolsApiImportModelStateResult = IModelStateWireImportResult;

/**
 * Agent-window **client**. Lives in the peer that does **not** run tool handlers.
 *
 * Obtained via {@link IToolsApiFactory.getClientApi} (peer `Window`) or
 * {@link IToolsApiFactory.getParentClientApi} (`window.parent`).
 *
 * Await `peerIsReady` (or let `listTools` / `execute` / `getAgentConfig` /
 * `getSessionInfo` / `createModelState` / `importModelState` await it) before
 * assuming App Builder is listening.
 *
 * `createModelState` and `importModelState` snapshot and restore the App Builder
 * model. They are not agent tools and do not appear in `listTools`.
 */
export interface IToolsApi {
	readonly peerIsReady: Promise<ICrossWindowPeerInfo>;
	listTools(): Promise<IListToolsReply>;
	execute(data: IExecuteToolData): Promise<unknown>;
	getAgentConfig(): Promise<IAgentConfigReply | null>;
	getSessionInfo(): Promise<IAgentSessionInfo>;
	createModelState(
		data?: IToolsApiCreateModelStateData,
	): Promise<IToolsApiCreateModelStateResult>;
	importModelState(
		data: IToolsApiImportModelStateData,
	): Promise<IToolsApiImportModelStateResult>;
}

/**
 * Agent-window **client** factory. Same CrossWindow pattern as ECommerce,
 * roles inverted: App Builder is the server, the agent window is the client.
 *
 * Default names: this side `"agent"`, peer `"app"`. Timeout 20s unless
 * `options.timeout` overrides.
 *
 * Topology is **not** auto-detected. The caller passes the peer `Window`:
 * - App Builder `window.open` agent → client uses `opener`
 * - Agent iframe inside App Builder → client uses the App Builder frame
 * - App Builder iframe inside host agent → client uses {@link getParentClientApi}
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
}
