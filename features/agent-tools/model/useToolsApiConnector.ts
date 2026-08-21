import {useEffect, useRef} from "react";
import {ToolsApiFactory} from "../api/toolsApi";
import type {ResolvedGenericTool} from "../config/resolveToolset";
import {
	TOOLS_API_NAME_AGENT,
	TOOLS_API_NAME_APP,
	TOOLS_API_TIMEOUT_MS,
	type IToolsApiConnector,
	type IToolsApiHandlerMap,
} from "../config/toolsApi";

/**
 * Props for the App Builder ToolsApi **server** hook.
 *
 * `resolvedTools` / `toolHandlers` / `snapshotComplete` come from
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
	resolvedTools: ResolvedGenericTool[];
	/** Live handlers keyed by generic tool name. Same object WebMCP registers. */
	toolHandlers: IToolsApiHandlerMap;
	/**
	 * `true` once `takeAgentSnapshot` left `"unset"`.
	 * Handshake must not start with a fluctuating / empty toolset.
	 */
	snapshotComplete: boolean;
};

/**
 * App Builder entry for window-to-window **ToolsApi** (CrossWindow).
 *
 * This is the **server**. It does not implement tools. It binds the already-built
 * runtime (`resolvedTools` + `toolHandlers`) to a peer window so an external
 * agent can `listTools()` / `execute()` without WebMCP.
 *
 * ```
 * App Builder page                         Agent window (Step 3)
 * -----------------                        ---------------------
 * useAgentToolRuntime                      ToolsApiFactory.getClientApi
 *   resolvedTools + toolHandlers             .listTools() / .execute()
 *         │                                         │
 *         ├─ useWebMcpTools (same map)              │
 *         └─ useToolsApiConnector  ←── postMessage ─┘
 *              ToolsApiConnector
 *              LIST_TOOLS  → listToolsFromResolved
 *              EXECUTE_TOOL → executeResolvedTool → handlers
 * ```
 *
 * **When it connects.** Effect runs only if `window` is set **and**
 * `snapshotComplete` is true. Otherwise it returns without creating a connector.
 *
 * **Why refs.** `resolvedTools` and `toolHandlers` are stored in refs and read
 * when `getConnectorApi` resolves. The effect depends only on
 * `[peerWindow, snapshotComplete]` so a new handler identity does not tear down
 * the handshake. The constructor of `ToolsApiConnector` still captures the
 * arrays/maps passed at connect time; keep those identities stable from
 * `useAgentToolRuntime` / `useAgentToolHandlers`.
 *
 * **Lifecycle.**
 * 1. `ToolsApiFactory.getConnectorApi(peer, tools, handlers, "app", "agent", {timeout: 20000})`
 * 2. Connector registers LIST_TOOLS / EXECUTE_TOOL **then** starts handshake.
 * 3. `peerIsReady` rejection is swallowed so a missed handshake is not an
 *    unhandled rejection. Transport throw → empty catch (no fake toolset).
 * 4. Cleanup sets `effectAbandoned` and `cancel()`s listeners + handshake.
 *    If `getConnectorApi` finishes after unmount, the connector is cancelled
 *    immediately.
 *
 * **This hook returns void.** Callers do not get `IToolsApi`; that object lives
 * in the agent window. Success is "peer can list/execute". Failure is silent
 * at this layer (no UI).
 *
 * @see ToolsApiFactory.getConnectorApi
 * @see IToolsApi — client in the agent window
 * @see useAgentToolRuntime — shared snapshot + handlers
 * @see useWebMcpTools — parallel transport, not a dependency
 */
export function useToolsApiConnector(props: UseToolsApiConnectorProps): void {
	const {
		window: peerWindow,
		resolvedTools,
		toolHandlers,
		snapshotComplete,
	} = props;

	const resolvedToolsRef = useRef(resolvedTools);
	resolvedToolsRef.current = resolvedTools;
	const toolHandlersRef = useRef(toolHandlers);
	toolHandlersRef.current = toolHandlers;

	useEffect(() => {
		if (!peerWindow || !snapshotComplete) {
			return;
		}

		let effectAbandoned = false;
		let connector: IToolsApiConnector | undefined;

		void (async () => {
			try {
				connector = await ToolsApiFactory.getConnectorApi(
					peerWindow,
					resolvedToolsRef.current,
					toolHandlersRef.current,
					TOOLS_API_NAME_APP,
					TOOLS_API_NAME_AGENT,
					{timeout: TOOLS_API_TIMEOUT_MS},
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
