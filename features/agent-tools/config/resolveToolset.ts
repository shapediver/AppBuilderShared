import {
	defaultSettingsFor,
	IN_SCOPE_GENERIC_TOOL_NAMES,
	isInScopeGenericToolName,
	type InScopeGenericToolName,
} from "./inScopeGenericTools";

/** Settings bag from agent config. Overlay fields are tool-specific. */
type GenericToolSettings = {name: string};

type ResolveToolsetAgent = {
	useGenericToolDefaults?: boolean;
	genericTools?: GenericToolSettings[];
};

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
	agent: ResolveToolsetAgent | undefined,
): ResolvedGenericTool[] {
	const listed = genericToolsByName(agent?.genericTools);

	if (agent && agent.useGenericToolDefaults === false) {
		const resolved: ResolvedGenericTool[] = [];
		for (const tool of agent.genericTools ?? []) {
			if (!isInScopeGenericToolName(tool.name)) continue;
			resolved.push({name: tool.name, settings: tool});
		}
		return resolved;
	}

	return IN_SCOPE_GENERIC_TOOL_NAMES.map((name) => {
		const overlay = listed.get(name);
		return {
			name,
			settings: overlay ?? (defaultSettingsFor(name) as GenericToolSettings),
		};
	});
}
