import type {
	ICrossWindowApiOptions,
	ICrossWindowPeerInfo,
} from "@AppBuilderLib/shared/config/crosswindowapi/crosswindowapi";
import type {JsonSchema} from "../lib/zodToJsonSchema";
import type {InScopeGenericToolName} from "./inScopeGenericTools";
import type {ResolvedGenericTool} from "./resolveToolset";

export const MESSAGE_TYPE_LIST_TOOLS = "LIST_TOOLS";
export const MESSAGE_TYPE_EXECUTE_TOOL = "EXECUTE_TOOL";
export const MESSAGE_TYPE_TOOLS_API_HANDSHAKE = "TOOLS_API_HANDSHAKE";

export const TOOLS_API_NAME_APP = "app";
export const TOOLS_API_NAME_AGENT = "agent";
export const TOOLS_API_TIMEOUT_MS = 20000;

export type IToolsApiHandlerMap = Record<
	InScopeGenericToolName,
	(input: unknown) => Promise<unknown>
>;

export interface IListToolsTool {
	name: string;
	description: string;
	inputSchema: JsonSchema;
}

export interface IListToolsReply {
	tools: IListToolsTool[];
}

export interface IExecuteToolData {
	name: string;
	input: unknown;
}

export interface IToolsApi {
	readonly peerIsReady: Promise<ICrossWindowPeerInfo>;
	listTools(): Promise<IListToolsReply>;
	execute(data: IExecuteToolData): Promise<unknown>;
}

export interface IToolsApiConnector {
	readonly peerIsReady: Promise<ICrossWindowPeerInfo>;
	cancel(): void;
}

export interface IToolsApiFactory {
	getClientApi(
		window: Window,
		name?: string,
		peerName?: string,
		options?: ICrossWindowApiOptions,
	): Promise<IToolsApi>;
	getParentClientApi(
		name?: string,
		peerName?: string,
		options?: ICrossWindowApiOptions,
	): Promise<IToolsApi>;
	getConnectorApi(
		window: Window,
		resolved: ResolvedGenericTool[],
		handlers: IToolsApiHandlerMap,
		name?: string,
		peerName?: string,
		options?: ICrossWindowApiOptions,
	): Promise<IToolsApiConnector>;
}
