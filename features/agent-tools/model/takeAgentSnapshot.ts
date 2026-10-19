import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {IAppBuilderAgent} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";

export const AGENT_SNAPSHOT_UNSET = "unset" as const;

export type AgentSnapshot =
	| IAppBuilderAgent
	| undefined
	| typeof AGENT_SNAPSHOT_UNSET;

/** `agentId` when set; otherwise `agents[0]`. */
export function resolveAgentConfig(
	agents: IAppBuilderAgent[] | undefined,
	agentId?: string,
): IAppBuilderAgent | undefined {
	const id = agentId?.trim();
	if (id) {
		return agents?.find((agent) => agent.id === id);
	}
	return agents?.[0];
}

/**
 * First loaded agent config (including missing agents → undefined).
 * `"unset"` means data has not loaded yet. Parametric later updates are ignored.
 * `agentId` selects `IAppBuilder.agents` by id; omitted → `agents[0]`.
 */
export function takeAgentSnapshot(
	current: AgentSnapshot,
	appBuilderData: IAppBuilder | undefined,
	parseSettled = false,
	agentId?: string,
): AgentSnapshot {
	if (current !== AGENT_SNAPSHOT_UNSET) {
		return current;
	}
	if (appBuilderData !== undefined) {
		return resolveAgentConfig(appBuilderData.agents, agentId);
	}
	if (parseSettled) {
		return undefined;
	}
	return AGENT_SNAPSHOT_UNSET;
}
