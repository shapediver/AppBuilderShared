import type {
	GenericToolSettings,
	IAppBuilderAgent,
} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {
	defaultSettingsFor,
	IN_SCOPE_GENERIC_TOOL_NAMES,
	isInScopeGenericToolName,
	type InScopeGenericToolName,
} from "./inScopeGenericTools";

export type ResolvedGenericTool = {
	name: InScopeGenericToolName;
	settings: GenericToolSettings;
};

function overlayByName(
	listed: GenericToolSettings[] | undefined,
): Map<string, GenericToolSettings> {
	const map = new Map<string, GenericToolSettings>();
	for (const tool of listed ?? []) {
		map.set(tool.name, tool);
	}
	return map;
}

export function resolveToolset(
	agent: IAppBuilderAgent | undefined,
): ResolvedGenericTool[] {
	const listed = overlayByName(agent?.genericTools);

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
			settings: overlay ?? defaultSettingsFor(name),
		};
	});
}
