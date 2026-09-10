import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {IAppBuilderAgent} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {useRef} from "react";
import {
	resolveToolset,
	type ResolvedGenericTool,
} from "../config/resolveToolset";
import {AGENT_SNAPSHOT_UNSET, takeAgentSnapshot} from "./takeAgentSnapshot";
import {
	useAgentToolHandlers,
	type AgentToolHandlerMap,
} from "./useAgentToolHandlers";

export type UseAgentToolRuntimeProps = {
	/** Session namespace used by handlers (parameters, model state, viewport). */
	namespace?: string;
	/** Parsed App Builder JSON. `agents[0]` is snapshotted once (see takeAgentSnapshot). */
	appBuilderData?: IAppBuilder;
	/**
	 * `true` when JSON parse has finished even if there is no `IAppBuilder`.
	 * Lets the snapshot leave `"unset"` as `undefined` (defaults, no agent block).
	 */
	appBuilderParseSettled?: boolean;
};

export type UseAgentToolRuntimeResult = {
	/** Generic tools from `resolveToolset(agents[0])`. Shared by WebMCP and ToolsApi. */
	resolvedTools: ResolvedGenericTool[];
	/** Stable handler map (`useMemo` []). Same object for both transports. */
	toolHandlers: AgentToolHandlerMap;
	/** `false` while snapshot is still `"unset"` — do not handshake / register yet. */
	snapshotComplete: boolean;
	/**
	 * Frozen `IAppBuilder.agents[0]`, or `undefined` when agents[] is missing/empty.
	 * Passed into ToolsApi `getAgentConfig` (parameterized, not a singleton).
	 */
	agentConfig: IAppBuilderAgent | undefined;
};

/**
 * One agent snapshot and one handler map for **both** transports (WebMCP + ToolsApi).
 *
 * `takeAgentSnapshot` freezes `IAppBuilder.agents[0]` on first load (`undefined`
 * if the JSON has no agents). Later parametric updates to `agents` are ignored.
 * Until then the snapshot is `"unset"` and `snapshotComplete` is false.
 *
 * Callers:
 * - `useWebMcpTools({ resolvedTools, toolHandlers, snapshotComplete })`
 * - `useToolsApiConnector({ resolvedTools, toolHandlers, snapshotComplete, agentConfig, window? })`
 *
 * Do not resolve the toolset again inside those hooks.
 */
export function useAgentToolRuntime(
	props: UseAgentToolRuntimeProps,
): UseAgentToolRuntimeResult {
	const {namespace, appBuilderData, appBuilderParseSettled = false} = props;

	const agentRef = useRef(takeAgentSnapshot(AGENT_SNAPSHOT_UNSET, undefined));
	agentRef.current = takeAgentSnapshot(
		agentRef.current,
		appBuilderData,
		appBuilderParseSettled,
	);
	const snapshotComplete = agentRef.current !== AGENT_SNAPSHOT_UNSET;
	const agentConfig =
		agentRef.current === AGENT_SNAPSHOT_UNSET
			? undefined
			: agentRef.current;
	const resolvedTools = resolveToolset(agentConfig);
	const toolHandlers = useAgentToolHandlers({
		namespace: namespace ?? "",
		appBuilderData,
		resolvedTools,
	});

	return {resolvedTools, toolHandlers, snapshotComplete, agentConfig};
}
