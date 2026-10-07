import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {IAppBuilderAgent} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {useRef} from "react";
import {
	resolveSpecificTools,
	type ExecutableSpecificTool,
} from "../config/resolveSpecificTools";
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
	/** Parsed App Builder JSON. Selected agent is snapshotted once (see takeAgentSnapshot). */
	appBuilderData?: IAppBuilder;
	/**
	 * `true` when JSON parse has finished even if there is no `IAppBuilder`.
	 * Lets the snapshot leave `"unset"` as `undefined` (defaults, no agent block).
	 */
	appBuilderParseSettled?: boolean;
	/** Selects `IAppBuilder.agents` by id. Omitted → `agents[0]`. */
	agentId?: string;
};

export type UseAgentToolRuntimeResult = {
	/** Generic tools from `resolveToolset` of the selected agent. Shared by WebMCP and ToolsApi. */
	resolvedGenericTools: ResolvedGenericTool[];
	/** Specific tools from the same agent snapshot, each with `execute`. */
	resolvedSpecificTools: ExecutableSpecificTool[];
	/** Stable handler map (`useMemo` []). Same object for both transports. */
	toolHandlers: AgentToolHandlerMap;
	/** `false` while snapshot is still `"unset"` — do not handshake / register yet. */
	snapshotComplete: boolean;
	/**
	 * Frozen selected `IAppBuilder.agents` entry, or `undefined` when missing.
	 * Passed into ToolsApi `getAgentConfig` (parameterized, not a singleton).
	 */
	agentConfig: IAppBuilderAgent | undefined;
};

/**
 * One agent snapshot and one handler map for **both** transports (WebMCP + ToolsApi).
 *
 * `takeAgentSnapshot` freezes the selected agent on first load (`undefined`
 * if the JSON has no matching agent). Later parametric updates to `agents`
 * are ignored. Until then the snapshot is `"unset"` and `snapshotComplete`
 * is false.
 *
 * Callers:
 * - `useWebMcpTools({ resolvedGenericTools, resolvedSpecificTools, toolHandlers, snapshotComplete })`
 * - `useToolsApiConnector({ resolvedGenericTools, resolvedSpecificTools, toolHandlers, snapshotComplete, agentConfig, window? })`
 *
 * Do not resolve the toolset again inside those hooks.
 */
export function useAgentToolRuntime(
	props: UseAgentToolRuntimeProps,
): UseAgentToolRuntimeResult {
	const {
		namespace,
		appBuilderData,
		appBuilderParseSettled = false,
		agentId,
	} = props;

	const agentRef = useRef(takeAgentSnapshot(AGENT_SNAPSHOT_UNSET, undefined));
	agentRef.current = takeAgentSnapshot(
		agentRef.current,
		appBuilderData,
		appBuilderParseSettled,
		agentId,
	);
	const snapshotComplete = agentRef.current !== AGENT_SNAPSHOT_UNSET;
	const agentConfig =
		agentRef.current === AGENT_SNAPSHOT_UNSET
			? undefined
			: agentRef.current;
	const resolvedGenericTools = resolveToolset(agentConfig);
	const {toolHandlers, resolvedSpecificTools} = useAgentToolHandlers({
		namespace: namespace ?? "",
		appBuilderData,
		resolvedGenericTools,
		resolvedSpecificTools: resolveSpecificTools(
			agentConfig,
			resolvedGenericTools.map((tool) => tool.name),
		),
	});

	return {
		resolvedGenericTools,
		resolvedSpecificTools,
		toolHandlers,
		snapshotComplete,
		agentConfig,
	};
}
