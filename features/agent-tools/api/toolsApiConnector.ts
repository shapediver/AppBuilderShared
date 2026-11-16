import {
	ICrossWindowApi,
	ICrossWindowApiOptions,
	ICrossWindowCancelable,
	ICrossWindowFactory,
	ICrossWindowPeerInfo,
} from "@AppBuilderLib/shared/config/crosswindowapi/crosswindowapi";
import {CrossWindowApiFactory} from "@AppBuilderLib/shared/lib/crosswindowapi/crosswindowapi";
import {useResolvedThemeStore} from "@AppBuilderLib/shared/model/useResolvedThemeStore";
import {
	ASK_USER_QUESTION_ALREADY_OPEN,
	ASK_USER_QUESTION_DISMISSED,
	askUserQuestionInputSchema,
	type AskUserQuestionClaimResult,
	type AskUserQuestionCompleteData,
	type AskUserQuestionOutput,
} from "../config/askUserQuestion";
import {ASK_USER_QUESTION_TOOL_NAME} from "../config/inScopeGenericTools";
import type {ExecutableSpecificTool} from "../config/resolveSpecificTools";
import type {ResolvedGenericTool} from "../config/resolveToolset";
import {
	MESSAGE_TYPE_CLAIM_QUESTION,
	MESSAGE_TYPE_COMPLETE_QUESTION,
	MESSAGE_TYPE_CREATE_MODEL_STATE,
	MESSAGE_TYPE_EXECUTE_TOOL,
	MESSAGE_TYPE_GET_AGENT_CONFIG,
	MESSAGE_TYPE_GET_SESSION_INFO,
	MESSAGE_TYPE_GET_THEME,
	MESSAGE_TYPE_IMPORT_MODEL_STATE,
	MESSAGE_TYPE_LIST_TOOLS,
	MESSAGE_TYPE_QUESTION_CLOSED,
	MESSAGE_TYPE_REFRESH_JWT_TOKEN,
	MESSAGE_TYPE_THEME_UPDATED,
	MESSAGE_TYPE_TOOLS_API_HANDSHAKE,
	TOOLS_API_NAME_AGENT,
	TOOLS_API_NAME_APP,
	TOOLS_API_TIMEOUT_MS,
	agentConfigReplyFrom,
	agentSessionInfoFrom,
	type IAgentConfigReply,
	type IAgentSessionInfo,
	type IExecuteToolData,
	type IToolsApiCreateModelStateData,
	type IToolsApiImportModelStateData,
} from "../config/toolsApi";
import type {
	IToolsApiConnector,
	IToolsApiConnectorFactory,
	IToolsApiHandlerMap,
	IToolsApiModelStateHandlers,
} from "../config/toolsApiConnector";
import {
	executeResolvedTool,
	unknownToolResult,
} from "../lib/executeResolvedTool";
import {formatToolInputError} from "../lib/formatToolInputError";
import {listToolsFromResolved} from "../lib/listToolsFromResolved";
import {parseExecuteToolData} from "../lib/parseExecuteToolData";
import {useAskUserQuestionStore} from "../model/useAskUserQuestionStore";

/** How often a chat-claimed question checks whether the chat window closed. */
const PEER_CLOSED_POLL_MS = 1000;

function withDefaultTimeout(
	options?: ICrossWindowApiOptions,
): ICrossWindowApiOptions {
	return {
		timeout: TOOLS_API_TIMEOUT_MS,
		...options,
	};
}

/**
 * App Builder server. Registers LIST_TOOLS, EXECUTE_TOOL, GET_AGENT_CONFIG,
 * GET_SESSION_INFO, REFRESH_JWT_TOKEN, GET_THEME, CREATE_MODEL_STATE, and IMPORT_MODEL_STATE **before**
 * handshake so an eager client cannot race.
 * `cancel()` removes listeners and aborts handshake.
 *
 * LIST_TOOLS → {@link listToolsFromResolved}.
 * EXECUTE_TOOL → {@link parseExecuteToolData} then {@link executeResolvedTool}.
 * GET_AGENT_CONFIG → {@link agentConfigReplyFrom} (`null` if no Agent config).
 * GET_SESSION_INFO → {@link agentSessionInfoFrom} (`{}` if no session fields).
 * REFRESH_JWT_TOKEN → `refreshJwtToken`, then `{ jwtToken }`.
 * GET_THEME → the theme `useCustomTheme` published (`{}` until then).
 * CREATE_MODEL_STATE / IMPORT_MODEL_STATE → `modelState` handlers (not agent tools).
 * Malformed EXECUTE_TOOL (missing string `name`) → unknown-tool JSON, not a throw.
 *
 * Construct via {@link ToolsApiConnectorFactoryClass.getConnectorApi}.
 */
export class ToolsApiConnector implements IToolsApiConnector {
	#listenerCancels: ICrossWindowCancelable[] = [];
	#unsubscribeTheme: () => void = () => undefined;
	#crossWindowApi: ICrossWindowApi;
	#peerWindow?: Window;
	#claimedQuestionId: string | undefined;
	#peerClosedTimer: ReturnType<typeof setInterval> | undefined;
	#onPageHide = () => this.#closeClaimedQuestion(true);
	peerIsReady: Promise<ICrossWindowPeerInfo>;

	constructor(
		resolvedGenericTools: ResolvedGenericTool[],
		toolHandlers: IToolsApiHandlerMap,
		crossWindowApi: ICrossWindowApi,
		options?: ICrossWindowApiOptions,
		agentConfig?: IAgentConfigReply | null,
		sessionInfo?: IAgentSessionInfo | null,
		resolvedSpecificTools: ExecutableSpecificTool[] = [],
		showThreadHistory?: boolean,
		createThreadOnLoad?: boolean,
		modelState?: IToolsApiModelStateHandlers,
		refreshJwtToken?: () => Promise<string>,
		peerWindow?: Window,
	) {
		this.#crossWindowApi = crossWindowApi;
		this.#peerWindow = peerWindow;
		this.#listenerCancels.push(
			crossWindowApi.on(MESSAGE_TYPE_CLAIM_QUESTION, async (input) =>
				this.#claimQuestion(input, resolvedGenericTools),
			),
		);
		this.#listenerCancels.push(
			crossWindowApi.on(
				MESSAGE_TYPE_COMPLETE_QUESTION,
				async (data: AskUserQuestionCompleteData | undefined) =>
					this.#completeQuestion(data),
			),
		);
		this.#listenerCancels.push(
			crossWindowApi.on(MESSAGE_TYPE_LIST_TOOLS, async () =>
				listToolsFromResolved(
					resolvedGenericTools,
					resolvedSpecificTools,
				),
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
						resolvedGenericTools,
						toolHandlers,
						resolvedSpecificTools,
					);
				},
			),
		);
		this.#listenerCancels.push(
			crossWindowApi.on(MESSAGE_TYPE_GET_AGENT_CONFIG, async () =>
				agentConfigReplyFrom(
					agentConfig,
					showThreadHistory,
					createThreadOnLoad,
				),
			),
		);
		this.#listenerCancels.push(
			crossWindowApi.on(MESSAGE_TYPE_GET_SESSION_INFO, async () =>
				agentSessionInfoFrom(sessionInfo),
			),
		);
		this.#listenerCancels.push(
			crossWindowApi.on(MESSAGE_TYPE_REFRESH_JWT_TOKEN, async () => {
				if (!refreshJwtToken) {
					throw new Error(
						"App Builder cannot refresh the JWT for this session.",
					);
				}
				const jwtToken = (await refreshJwtToken()).trim();
				if (!jwtToken) {
					throw new Error("App Builder returned an empty JWT.");
				}
				if (sessionInfo) {
					sessionInfo.jwtToken = jwtToken;
				}
				return {jwtToken};
			}),
		);
		this.#listenerCancels.push(
			crossWindowApi.on(
				MESSAGE_TYPE_GET_THEME,
				async () => useResolvedThemeStore.getState().theme,
			),
		);
		this.#listenerCancels.push(
			crossWindowApi.on(
				MESSAGE_TYPE_CREATE_MODEL_STATE,
				async (data: IToolsApiCreateModelStateData | undefined) => {
					if (!modelState) {
						throw new Error("Model state is not available.");
					}
					return modelState.createModelState(data ?? {});
				},
			),
		);
		this.#listenerCancels.push(
			crossWindowApi.on(
				MESSAGE_TYPE_IMPORT_MODEL_STATE,
				async (data: IToolsApiImportModelStateData) => {
					if (!modelState) {
						throw new Error("Model state is not available.");
					}
					return modelState.importModelState(data);
				},
			),
		);
		this.peerIsReady = crossWindowApi.handshake(
			MESSAGE_TYPE_TOOLS_API_HANDSHAKE,
			options?.timeout,
		);
		this.#unsubscribeTheme = useResolvedThemeStore.subscribe(
			(state, previous) => {
				if (state.theme === previous.theme) {
					return;
				}
				void this.#crossWindowApi
					.send(MESSAGE_TYPE_THEME_UPDATED, undefined)
					.catch(() => undefined);
			},
		);
	}

	/**
	 * CLAIM_QUESTION: validate like the tool, then take the page's single
	 * open-question slot for the chat. Never waits for the user.
	 */
	#claimQuestion(
		input: unknown,
		resolvedGenericTools: ResolvedGenericTool[],
	): AskUserQuestionClaimResult {
		if (
			!resolvedGenericTools.some(
				(tool) => tool.name === ASK_USER_QUESTION_TOOL_NAME,
			)
		) {
			return unknownToolResult(ASK_USER_QUESTION_TOOL_NAME);
		}
		const parsed = askUserQuestionInputSchema.safeParse(input ?? {});
		if (!parsed.success) {
			return {
				success: false,
				message: formatToolInputError(parsed.error).errors[0].message,
			};
		}
		const {questions} = parsed.data;
		const claim = useAskUserQuestionStore
			.getState()
			.claim(questions, "chat");
		if (!claim) {
			return {success: false, message: ASK_USER_QUESTION_ALREADY_OPEN};
		}
		this.#claimedQuestionId = claim.id;
		this.#watchClaimedQuestion();
		return {success: true, id: claim.id, questions};
	}

	/**
	 * COMPLETE_QUESTION: answer or dismiss the chat's claimed question.
	 * Always releases the claim: the chat has stopped showing it.
	 */
	#completeQuestion(
		data: AskUserQuestionCompleteData | undefined,
	): AskUserQuestionOutput {
		const id = data?.id;
		if (typeof id !== "string" || id !== this.#claimedQuestionId) {
			return {success: false, message: "No open question."};
		}
		this.#releaseClaimedQuestion();
		const store = useAskUserQuestionStore.getState();
		if (data?.answers === undefined) {
			return (
				store.dismiss(id) ?? {
					success: false,
					message: ASK_USER_QUESTION_DISMISSED,
				}
			);
		}
		const output = store.answer(id, data.answers);
		if (output) {
			return output;
		}
		store.dismiss(id);
		return {
			success: false,
			message: "Answer every question with a non-empty answer.",
		};
	}

	/** Release the slot when the page hides or the chat window closes. */
	#watchClaimedQuestion(): void {
		if (this.#peerClosedTimer !== undefined) {
			clearInterval(this.#peerClosedTimer);
			this.#peerClosedTimer = undefined;
		}
		if (typeof window !== "undefined") {
			window.addEventListener("pagehide", this.#onPageHide);
		}
		const peer = this.#peerWindow;
		if (peer) {
			this.#peerClosedTimer = setInterval(() => {
				if (peer.closed) {
					this.#closeClaimedQuestion(false);
				}
			}, PEER_CLOSED_POLL_MS);
		}
	}

	#releaseClaimedQuestion(): void {
		this.#claimedQuestionId = undefined;
		if (typeof window !== "undefined") {
			window.removeEventListener("pagehide", this.#onPageHide);
		}
		if (this.#peerClosedTimer !== undefined) {
			clearInterval(this.#peerClosedTimer);
			this.#peerClosedTimer = undefined;
		}
	}

	/** Dismiss the chat's open question and, if asked, tell the chat. */
	#closeClaimedQuestion(notifyPeer: boolean): void {
		const id = this.#claimedQuestionId;
		if (id === undefined) {
			return;
		}
		this.#releaseClaimedQuestion();
		useAskUserQuestionStore.getState().dismiss(id);
		if (notifyPeer) {
			void this.#crossWindowApi
				.send(MESSAGE_TYPE_QUESTION_CLOSED, {id})
				.catch(() => undefined);
		}
	}

	/** Drop tool and model-state listeners and cancel an in-flight handshake. */
	cancel(): void {
		this.#closeClaimedQuestion(true);
		this.#unsubscribeTheme();
		this.#unsubscribeTheme = () => undefined;
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
	 * `resolvedGenericTools` filters generic names; `toolHandlers` runs those.
	 * `resolvedSpecificTools` are listed and run via each tool's `execute`.
	 * `agentConfig` is `IAppBuilder.agents[0]` (parameterized).
	 * `sessionInfo` is controller session fields for `getSessionInfo`.
	 * Called from {@link useToolsApiConnector} once snapshot + peer window exist.
	 */
	async getConnectorApi(
		window: Window,
		resolvedGenericTools: ResolvedGenericTool[],
		toolHandlers: IToolsApiHandlerMap,
		name = TOOLS_API_NAME_APP,
		peerName = TOOLS_API_NAME_AGENT,
		options?: ICrossWindowApiOptions,
		agentConfig?: IAgentConfigReply | null,
		sessionInfo?: IAgentSessionInfo | null,
		resolvedSpecificTools?: ExecutableSpecificTool[],
		showThreadHistory?: boolean,
		createThreadOnLoad?: boolean,
		modelState?: IToolsApiModelStateHandlers,
		refreshJwtToken?: () => Promise<string>,
	): Promise<IToolsApiConnector> {
		const optionsWithTimeout = withDefaultTimeout(options);
		const api = await this.crossWindowFactory.getWindowApi(
			window,
			name,
			peerName,
			optionsWithTimeout,
		);
		return new ToolsApiConnector(
			resolvedGenericTools,
			toolHandlers,
			api,
			optionsWithTimeout,
			agentConfig,
			sessionInfo,
			resolvedSpecificTools,
			showThreadHistory,
			createThreadOnLoad,
			modelState,
			refreshJwtToken,
			window,
		);
	}
}

/** Process-wide factory used by App Builder (`useToolsApiConnector`). */
export const ToolsApiConnectorFactory = new ToolsApiConnectorFactoryClass(
	CrossWindowApiFactory,
);
