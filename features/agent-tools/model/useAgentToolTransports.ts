import {useMemo, useRef} from "react";
import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {isWebMcpAvailable} from "@AppBuilderLib/features/webmcp/lib/webmcpAvailability";
import {useWebMcpTools} from "@AppBuilderLib/features/webmcp/model/useWebMcpTools";
import type {IAgentSessionInfo} from "../config/toolsApi";
import {
	useAgentToolRuntime,
	type UseAgentToolRuntimeResult,
} from "./useAgentToolRuntime";
import {toolsApiModelStateHandlers} from "./toolsApiModelState";
import {useToolsApiConnector} from "./useToolsApiConnector";

export type UseAgentToolTransportsProps = {
	namespace?: string;
	appBuilderData?: IAppBuilder;
	appBuilderParseSettled?: boolean;
	/** Peer agent window for ToolsApi. Omit / null → connector is a no-op. */
	agentWindow?: Window | null;
	/** Controller session fields for ToolsApi `getSessionInfo`. */
	sessionInfo?: IAgentSessionInfo;
	/**
	 * Resolved `AgentUi.showThreadHistory`, sent on `getAgentConfig` when the
	 * peer connects. Omitted by callers that predate the agent chrome.
	 */
	showThreadHistory?: boolean;
	/**
	 * Resolved `AgentUi.createThreadOnLoad`, sent on `getAgentConfig` when the
	 * peer connects. Independent of history chrome.
	 */
	createThreadOnLoad?: boolean;
	/** Selects `IAppBuilder.agents` by id. Omitted → `agents[0]`. */
	agentId?: string;
};

/**
 * WebMCP + ToolsApi on one {@link useAgentToolRuntime} snapshot.
 * Page code should call {@link useAppBuilderAgentHost}, not this hook.
 */
export type UseAgentToolTransportsResult = UseAgentToolRuntimeResult & {
	/** ToolsApi handshake with the peer window is up. */
	peerConnected: boolean;
};

export function useAgentToolTransports(
	props: UseAgentToolTransportsProps,
): UseAgentToolTransportsResult {
	const {
		namespace,
		appBuilderData,
		appBuilderParseSettled,
		agentWindow = null,
		sessionInfo,
		showThreadHistory,
		createThreadOnLoad,
		agentId,
	} = props;

	const runtime = useAgentToolRuntime({
		namespace,
		appBuilderData,
		appBuilderParseSettled,
		agentId,
	});

	const namespaceRef = useRef(namespace);
	namespaceRef.current = namespace;
	const modelState = useMemo(
		() => toolsApiModelStateHandlers(() => namespaceRef.current),
		[],
	);

	useWebMcpTools({
		namespace,
		enabled: isWebMcpAvailable(),
		resolvedGenericTools: runtime.resolvedGenericTools,
		resolvedSpecificTools: runtime.resolvedSpecificTools,
		toolHandlers: runtime.toolHandlers,
		snapshotComplete: runtime.snapshotComplete,
	});

	const peerConnected = useToolsApiConnector({
		window: agentWindow,
		resolvedGenericTools: runtime.resolvedGenericTools,
		resolvedSpecificTools: runtime.resolvedSpecificTools,
		toolHandlers: runtime.toolHandlers,
		snapshotComplete: runtime.snapshotComplete,
		agentConfig: runtime.agentConfig,
		sessionInfo,
		showThreadHistory,
		createThreadOnLoad,
		modelState,
	});

	return {...runtime, peerConnected};
}
