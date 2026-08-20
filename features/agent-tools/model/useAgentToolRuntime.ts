import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
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
	namespace?: string;
	appBuilderData?: IAppBuilder;
	appBuilderParseSettled?: boolean;
};

export type UseAgentToolRuntimeResult = {
	resolved: ResolvedGenericTool[];
	handlers: AgentToolHandlerMap;
	snapshotComplete: boolean;
};

export function useAgentToolRuntime(
	props: UseAgentToolRuntimeProps,
): UseAgentToolRuntimeResult {
	const {
		namespace,
		appBuilderData,
		appBuilderParseSettled = false,
	} = props;

	const agentRef = useRef(takeAgentSnapshot(AGENT_SNAPSHOT_UNSET, undefined));
	agentRef.current = takeAgentSnapshot(
		agentRef.current,
		appBuilderData,
		appBuilderParseSettled,
	);
	const snapshotComplete = agentRef.current !== AGENT_SNAPSHOT_UNSET;
	const resolved = resolveToolset(
		agentRef.current === AGENT_SNAPSHOT_UNSET ? undefined : agentRef.current,
	);
	const handlers = useAgentToolHandlers({
		namespace: namespace ?? "",
		appBuilderData,
		resolved,
	});

	return {resolved, handlers, snapshotComplete};
}
