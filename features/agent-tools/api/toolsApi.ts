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
	#listenerCancels: ICrossWindowCancelable[] = [];
	peerIsReady: Promise<ICrossWindowPeerInfo>;

	constructor(
		resolvedTools: ResolvedGenericTool[],
		toolHandlers: IToolsApiHandlerMap,
		crossWindowApi: ICrossWindowApi,
		options?: ICrossWindowApiOptions,
	) {
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

	cancel(): void {
		for (const token of this.#listenerCancels) {
			token.cancel();
		}
		this.#listenerCancels = [];
	}
}

export class ToolsApiFactoryClass implements IToolsApiFactory {
	constructor(private readonly crossWindowFactory: ICrossWindowFactory) {}

	private createClientApi(
		crossWindowApi: ICrossWindowApi,
		options: ICrossWindowApiOptions,
	): IToolsApi {
		return new ToolsApi(crossWindowApi, options);
	}

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

export const ToolsApiFactory = new ToolsApiFactoryClass(CrossWindowApiFactory);
