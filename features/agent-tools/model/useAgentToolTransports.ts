import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {isWebMcpAvailable} from "@AppBuilderLib/features/webmcp/lib/webmcpAvailability";
import {useWebMcpTools} from "@AppBuilderLib/features/webmcp/model/useWebMcpTools";
import type {IAgentSessionInfo} from "../config/toolsApi";
import {
	useAgentToolRuntime,
	type UseAgentToolRuntimeResult,
} from "./useAgentToolRuntime";
import {useToolsApiConnector} from "./useToolsApiConnector";

export type UseAgentToolTransportsProps = {
	namespace?: string;
	appBuilderData?: IAppBuilder;
	appBuilderParseSettled?: boolean;
	/** Peer agent window for ToolsApi. Omit / null → connector is a no-op. */
	agentWindow?: Window | null;
	/** Controller session fields for ToolsApi `getSessionInfo`. */
	sessionInfo?: IAgentSessionInfo;
};

/**
 * WebMCP + ToolsApi on one {@link useAgentToolRuntime} snapshot.
 * Page code should call {@link useAppBuilderAgentHost}, not this hook.
 */
export function useAgentToolTransports(
	props: UseAgentToolTransportsProps,
): UseAgentToolRuntimeResult {
	const {
		namespace,
		appBuilderData,
		appBuilderParseSettled,
		agentWindow = null,
		sessionInfo,
	} = props;

	const runtime = useAgentToolRuntime({
		namespace,
		appBuilderData,
		appBuilderParseSettled,
	});

	useWebMcpTools({
		namespace,
		enabled: isWebMcpAvailable(),
		resolvedTools: runtime.resolvedTools,
		toolHandlers: runtime.toolHandlers,
		snapshotComplete: runtime.snapshotComplete,
	});

	useToolsApiConnector({
		window: agentWindow,
		resolvedTools: runtime.resolvedTools,
		toolHandlers: runtime.toolHandlers,
		snapshotComplete: runtime.snapshotComplete,
		agentConfig: runtime.agentConfig,
		sessionInfo,
	});

	return runtime;
}
