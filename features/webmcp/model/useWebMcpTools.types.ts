import type {ResolvedGenericTool} from "@AppBuilderLib/features/agent-tools/config/resolveToolset";
import type {IToolsApiHandlerMap} from "@AppBuilderLib/features/agent-tools/config/toolsApi";

export interface UseWebMcpToolsProps {
	namespace?: string;
	enabled?: boolean;
	resolvedTools: ResolvedGenericTool[];
	toolHandlers: IToolsApiHandlerMap;
	snapshotComplete: boolean;
	/**
	 * Extra tool names (`tool.name`) to NOT register from webmcp/core.
	 * Agent generic tools from `resolvedTools` are always skipped there
	 * so list/set stay on the agent-tools handlers.
	 */
	disabledTools?: string[];
}

export interface WebMcpEnvironment {
	modelContextAvailable: boolean;
	crossOriginIsolated: boolean;
}

export interface UseWebMcpToolsResult {
	/** Tools registered on `modelContext` (registration may succeed without COI). */
	registered: boolean;
	/** Tools callable by agents: `registered` and cross-origin isolated with `modelContext`. */
	ready: boolean;
	environment: WebMcpEnvironment;
}
