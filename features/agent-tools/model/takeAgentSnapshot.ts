import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {IAppBuilderAgent} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";

export const AGENT_SNAPSHOT_UNSET = "unset" as const;

export type AgentSnapshot =
	| IAppBuilderAgent
	| undefined
	| typeof AGENT_SNAPSHOT_UNSET;

/**
 * First loaded `IAppBuilder.agents[0]` (including missing agents → undefined).
 * `"unset"` means data has not loaded yet. Parametric later updates are ignored.
 */
export function takeAgentSnapshot(
	current: AgentSnapshot,
	appBuilderData: IAppBuilder | undefined,
	parseSettled = false,
): AgentSnapshot {
	if (current !== AGENT_SNAPSHOT_UNSET) {
		return current;
	}
	if (appBuilderData !== undefined) {
		return appBuilderData.agents?.[0];
	}
	if (parseSettled) {
		return undefined;
	}
	return AGENT_SNAPSHOT_UNSET;
}
