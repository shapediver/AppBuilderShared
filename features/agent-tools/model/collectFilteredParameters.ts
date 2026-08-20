import type {ListParameterDefinitionsToolSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {collectUiParameterRefs} from "../lib/collectUiParameterRefs";
import {
	filterParametersForAgent,
	type NamespacedParameter,
} from "../lib/filterParametersForAgent";
import type {AgentToolsDeps} from "./agentToolsDeps";

export function collectFilteredParameters(
	settings: ListParameterDefinitionsToolSettings,
	deps: AgentToolsDeps,
): NamespacedParameter[] {
	const appBuilder = deps.getAppBuilder();
	const uiRefs = appBuilder ? collectUiParameterRefs(appBuilder) : [];
	const refs = settings.parameters;
	const sessionIds =
		refs && refs.length > 0
			? [
					...new Set(
						refs.map(
							(ref) => ref.sessionId ?? deps.controllerNamespace,
						),
					),
				]
			: (settings.filter?.sessionIds ?? [deps.controllerNamespace]);
	const namespaced = sessionIds.flatMap((ns) =>
		deps.getLiveParameters(ns).map((parameter) => ({
			namespace: ns,
			parameter,
		})),
	);
	return filterParametersForAgent({
		parameters: namespaced,
		controllerNamespace: deps.controllerNamespace,
		settings,
		uiRefs,
	});
}
