import type {ResolvedGenericTool} from "@AppBuilderLib/features/agent-tools/config/resolveToolset";
import type {IToolsApiHandlerMap} from "@AppBuilderLib/features/agent-tools/config/toolsApiConnector";

export interface UseWebMcpToolsProps {
	namespace?: string;
	enabled?: boolean;
	resolvedTools: ResolvedGenericTool[];
	toolHandlers: IToolsApiHandlerMap;
	snapshotComplete: boolean;
}

export interface WebMcpEnvironment {
	modelContextAvailable: boolean;
}

export interface UseWebMcpToolsResult {
	/** Tools registered on `modelContext`. */
	registered: boolean;
	/** Tools registered and `modelContext` is available. */
	ready: boolean;
	environment: WebMcpEnvironment;
}
