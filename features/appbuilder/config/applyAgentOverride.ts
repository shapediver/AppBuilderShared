import type {IAppBuilder} from "./appbuilder";
import type {IAppBuilderAgent} from "./appbuilderagent";

/**
 * Replace `IAppBuilder.agents` with a settings-level override.
 * When there is no resolved App Builder data, synthesize a skeleton so agents
 * can still load (fallback UI stays gated on `hasAppBuilderOutput`).
 */
export function applyAgentOverride(
	data: IAppBuilder | Error | undefined,
	agentOverride: IAppBuilderAgent[] | undefined,
): IAppBuilder | Error | undefined {
	if (agentOverride === undefined) {
		return data;
	}
	if (data instanceof Error) {
		return data;
	}
	if (!data) {
		return {
			version: "1.0",
			containers: [],
			agents: agentOverride,
		};
	}

	return {...data, agents: agentOverride};
}
