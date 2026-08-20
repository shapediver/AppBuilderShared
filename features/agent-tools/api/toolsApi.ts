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
import {executeResolvedTool, unknownToolResult} from "../lib/executeResolvedTool";
import {listToolsFromResolved} from "../lib/listToolsFromResolved";

function withDefaultTimeout(
	options?: ICrossWindowApiOptions,
): ICrossWindowApiOptions {
	return {
		timeout: TOOLS_API_TIMEOUT_MS,
		...options,
	};
}

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

	async listTools(): Promise<IListToolsReply> {
		await this.peerIsReady;
		return this.#crossWindowApi.send(
			MESSAGE_TYPE_LIST_TOOLS,
			undefined,
			this.#timeout,
		);
	}

	async execute(data: IExecuteToolData): Promise<unknown> {
		await this.peerIsReady;
		return this.#crossWindowApi.send(
			MESSAGE_TYPE_EXECUTE_TOOL,
			data,
			this.#timeout,
		);
	}
}

export class ToolsApiConnector implements IToolsApiConnector {
	#cancels: ICrossWindowCancelable[] = [];
	#_peerIsReady: Promise<ICrossWindowPeerInfo>;

	get peerIsReady() {
		return this.#_peerIsReady;
	}

	constructor(
		resolved: ResolvedGenericTool[],
		handlers: IToolsApiHandlerMap,
		crossWindowApi: ICrossWindowApi,
		options?: ICrossWindowApiOptions,
	) {
		this.#cancels.push(
			crossWindowApi.on(MESSAGE_TYPE_LIST_TOOLS, async () =>
				listToolsFromResolved(resolved),
			),
		);
		this.#cancels.push(
			crossWindowApi.on(
				MESSAGE_TYPE_EXECUTE_TOOL,
				async (data: IExecuteToolData) => {
					if (
						!data ||
						typeof data !== "object" ||
						typeof data.name !== "string"
					) {
						return unknownToolResult("");
					}
					return executeResolvedTool(
						data.name,
						data.input,
						resolved,
						handlers,
					);
				},
			),
		);
		this.#_peerIsReady = crossWindowApi.handshake(
			MESSAGE_TYPE_TOOLS_API_HANDSHAKE,
			options?.timeout,
		);
	}

	cancel(): void {
		for (const token of this.#cancels) {
			token.cancel();
		}
		this.#cancels = [];
	}
}

class _ToolsApiFactory implements IToolsApiFactory {
	constructor(private readonly crossWindowFactory: ICrossWindowFactory) {}

	async getClientApi(
		window: Window,
		name = TOOLS_API_NAME_AGENT,
		peerName = TOOLS_API_NAME_APP,
		options?: ICrossWindowApiOptions,
	): Promise<IToolsApi> {
		const opts = withDefaultTimeout(options);
		const api = await this.crossWindowFactory.getWindowApi(
			window,
			name,
			peerName,
			opts,
		);
		return new ToolsApi(api, opts);
	}

	async getParentClientApi(
		name = TOOLS_API_NAME_AGENT,
		peerName = TOOLS_API_NAME_APP,
		options?: ICrossWindowApiOptions,
	): Promise<IToolsApi> {
		const opts = withDefaultTimeout(options);
		const api = await this.crossWindowFactory.getParentApi(
			name,
			peerName,
			opts,
		);
		return new ToolsApi(api, opts);
	}

	async getConnectorApi(
		window: Window,
		resolved: ResolvedGenericTool[],
		handlers: IToolsApiHandlerMap,
		name = TOOLS_API_NAME_APP,
		peerName = TOOLS_API_NAME_AGENT,
		options?: ICrossWindowApiOptions,
	): Promise<IToolsApiConnector> {
		const opts = withDefaultTimeout(options);
		const api = await this.crossWindowFactory.getWindowApi(
			window,
			name,
			peerName,
			opts,
		);
		return new ToolsApiConnector(resolved, handlers, api, opts);
	}
}

export const ToolsApiFactory = new _ToolsApiFactory(CrossWindowApiFactory);
