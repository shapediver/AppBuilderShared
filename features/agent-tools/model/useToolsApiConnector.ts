import {useEffect, useRef} from "react";
import {ToolsApiConnectorFactory} from "../api/toolsApiConnector";
import type {ExecutableSpecificTool} from "../config/resolveSpecificTools";
import type {ResolvedGenericTool} from "../config/resolveToolset";
import {
	TOOLS_API_NAME_AGENT,
	TOOLS_API_NAME_APP,
	TOOLS_API_TIMEOUT_MS,
	type IAgentConfigReply,
	type IAgentSessionInfo,
} from "../config/toolsApi";
import type {
	IToolsApiConnector,
	IToolsApiHandlerMap,
} from "../config/toolsApiConnector";

/**
 * Props for the App Builder ToolsApi **server** hook.
 *
 * `resolvedGenericTools` / `toolHandlers` / `snapshotComplete` come from
 * {@link useAgentToolRuntime} — the same snapshot WebMCP uses. Do not build a
 * second toolset here.
 */
export type UseToolsApiConnectorProps = {
	/**
	 * Peer agent `Window` (`window.open` result, `iframe.contentWindow`, or
	 * `window.parent` when App Builder is the iframe).
	 *
	 * Omit / `null` → hook is a no-op. `AppBuilderPage` currently omits this
	 * until Step 3 (agent window + LangChain client). WebMCP still works.
	 */
	window?: Window | null;
	/** Tools this connector may list and execute (`resolveToolset` output). */
	resolvedGenericTools: ResolvedGenericTool[];
	/** Specific tools from the same snapshot. Each carries `execute`. */
	resolvedSpecificTools?: ExecutableSpecificTool[];
	/** Live handlers keyed by generic tool name. Same object WebMCP registers. */
	toolHandlers: IToolsApiHandlerMap;
	/**
	 * `true` once `takeAgentSnapshot` left `"unset"`.
	 * Handshake must not start with a fluctuating / empty toolset.
	 */
	snapshotComplete: boolean;
	/**
	 * Parameterized Agent config (`IAppBuilder.agents[0]`). `undefined` / omit →
	 * `getAgentConfig` replies `null` (Chat page fallback prompt).
	 */
	agentConfig?: IAgentConfigReply | null;
	/**
	 * Controller session fields (`jwtToken`, `slug`, `modelStateId`).
	 * `undefined` / omit → `getSessionInfo` replies `{}`.
	 */
	sessionInfo?: IAgentSessionInfo;
};

/**
 * App Builder entry for window-to-window **ToolsApi** (CrossWindow).
 *
 * This is the **server**. It does not implement tools. It binds the already-built
 * runtime (`resolvedGenericTools` + `resolvedSpecificTools` + `toolHandlers`) to a peer window so an external
 * agent can `listTools()` / `execute()` without WebMCP.
 *
 * ```
 * App Builder page                         Agent window (Step 3)
 * -----------------                        ---------------------
 * useAgentToolRuntime                      ToolsApiFactory.getClientApi
 *   resolvedGenericTools + resolvedSpecificTools + toolHandlers + agentConfig + sessionInfo
 *         │                                         │
 *         ├─ useWebMcpTools (same map)              │
 *         └─ useToolsApiConnector  ←── postMessage ─┘
 *              ToolsApiConnector
 *              LIST_TOOLS  → listToolsFromResolved
 *              EXECUTE_TOOL → executeResolvedTool → handlers or tool.execute
 *              GET_AGENT_CONFIG → { id, name, message } | null
 *              GET_SESSION_INFO → { jwtToken, slug, modelStateId }
 * ```
 *
 * **When it connects.** Effect runs only if `window` is set **and**
 * `snapshotComplete` is true. Otherwise it returns without creating a connector.
 *
 * **Why refs.** `resolvedGenericTools`, `resolvedSpecificTools`, `toolHandlers`, `agentConfig`, and `sessionInfo`
 * are stored in refs and read when `getConnectorApi` resolves. The effect depends
 * only on `[peerWindow, snapshotComplete]` so a new handler identity does not tear
 * down the handshake. The constructor of `ToolsApiConnector` still captures the
 * arrays/maps passed at connect time; keep those identities stable from
 * `useAgentToolRuntime` / `useAgentToolHandlers`.
 *
 * **Lifecycle.**
 * 1. `ToolsApiConnectorFactory.getConnectorApi(peer, tools, handlers, "app", "agent", {timeout: 20000})`
 * 2. Connector registers LIST_TOOLS / EXECUTE_TOOL / GET_AGENT_CONFIG /
 *    GET_SESSION_INFO **then** starts handshake.
 * 3. `peerIsReady` rejection is swallowed so a missed handshake is not an
 *    unhandled rejection. Transport throw → empty catch (no fake toolset).
 * 4. Cleanup sets `effectAbandoned` and `cancel()`s listeners + handshake.
 *    If `getConnectorApi` finishes after unmount, the connector is cancelled
 *    immediately.
 *
 * **This hook returns void.** Callers do not get `IToolsApi`; that object lives
 * in the agent window. Success is "peer can list/execute/getAgentConfig/getSessionInfo". Failure
 * is silent at this layer (no UI).
 *
 * @see ToolsApiConnectorFactory.getConnectorApi
 * @see IToolsApi — client in the agent window
 * @see useAgentToolRuntime — shared snapshot + handlers
 * @see useWebMcpTools — parallel transport, not a dependency
 */
export function useToolsApiConnector(props: UseToolsApiConnectorProps): void {
	const {
		window: peerWindow,
		resolvedGenericTools,
		resolvedSpecificTools = [],
		toolHandlers,
		snapshotComplete,
		agentConfig,
		sessionInfo,
	} = props;

	const resolvedGenericToolsRef = useRef(resolvedGenericTools);
	resolvedGenericToolsRef.current = resolvedGenericTools;
	const resolvedSpecificToolsRef = useRef(resolvedSpecificTools);
	resolvedSpecificToolsRef.current = resolvedSpecificTools;
	const toolHandlersRef = useRef(toolHandlers);
	toolHandlersRef.current = toolHandlers;
	const agentConfigRef = useRef(agentConfig);
	agentConfigRef.current = agentConfig;
	const sessionInfoRef = useRef(sessionInfo);
	sessionInfoRef.current = sessionInfo;

	useEffect(() => {
		if (!peerWindow || !snapshotComplete) {
			return;
		}

		let effectAbandoned = false;
		let connector: IToolsApiConnector | undefined;

		void (async () => {
			try {
				connector = await ToolsApiConnectorFactory.getConnectorApi(
					peerWindow,
					resolvedGenericToolsRef.current,
					toolHandlersRef.current,
					TOOLS_API_NAME_APP,
					TOOLS_API_NAME_AGENT,
					{timeout: TOOLS_API_TIMEOUT_MS},
					agentConfigRef.current,
					sessionInfoRef.current,
					resolvedSpecificToolsRef.current,
				);
				void connector.peerIsReady.catch(() => {});
				if (effectAbandoned) {
					connector.cancel();
					return;
				}
			} catch {
				// getConnectorApi / transport failure — not a fake toolset
			}
		})();

		return () => {
			effectAbandoned = true;
			connector?.cancel();
		};
	}, [peerWindow, snapshotComplete]);
}
