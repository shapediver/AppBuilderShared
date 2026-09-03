import type {
	GenericToolSettings,
	IAppBuilderAgent,
} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {
	defaultSettingsFor,
	IN_SCOPE_GENERIC_TOOL_NAMES,
	isGenericToolSettingsFor,
	isInScopeGenericToolName,
	type InScopeGenericToolName,
} from "./inScopeGenericTools";

export type ResolvedGenericTool = {
	name: InScopeGenericToolName;
	settings: GenericToolSettings;
};

/** Last listed settings per tool name. Used only when defaults are on. */
function genericToolsByName(
	listed: GenericToolSettings[] | undefined,
): Map<string, GenericToolSettings> {
	const map = new Map<string, GenericToolSettings>();
	for (const tool of listed ?? []) {
		map.set(tool.name, tool);
	}
	return map;
}

/**
 * In-scope generic tools for one agent (or defaults when `agent` is missing).
 * `useGenericToolDefaults !== false` → every in-scope name, overlay from `genericTools`.
 * `useGenericToolDefaults === false` → listed in-scope tools only (`genericToolsByName` unused).
 * `specificTools` and `ask_user_question` are ignored.
 */
export function resolveToolset(
	agent:
		| Pick<IAppBuilderAgent, "useGenericToolDefaults" | "genericTools">
		| undefined,
): ResolvedGenericTool[] {
	const listed = genericToolsByName(agent?.genericTools);

	if (agent && agent.useGenericToolDefaults === false) {
		const resolved: ResolvedGenericTool[] = [];
		for (const tool of agent.genericTools ?? []) {
			if (!isInScopeGenericToolName(tool.name)) continue;
			if (!isGenericToolSettingsFor(tool, tool.name)) continue;
			resolved.push({name: tool.name, settings: tool});
		}
		return resolved;
	}

	return IN_SCOPE_GENERIC_TOOL_NAMES.map((name) => {
		const overlay = listed.get(name);
		const settings =
			overlay && isGenericToolSettingsFor(overlay, name)
				? overlay
				: defaultSettingsFor(name);
		return {name, settings};
	});
}
