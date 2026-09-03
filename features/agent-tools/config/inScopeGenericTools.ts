import {
	GenericToolName,
	type GenericToolSettings,
} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";

/** Generic tools Step 1 exposes. Excludes `GenericToolName.AskUserQuestion`. */
export type InScopeGenericToolName = Exclude<
	GenericToolName,
	GenericToolName.AskUserQuestion
>;

export const IN_SCOPE_GENERIC_TOOL_NAMES: InScopeGenericToolName[] = [
	GenericToolName.ListParameterDefinitions,
	GenericToolName.GetParameterValues,
	GenericToolName.SetParameterValues,
	GenericToolName.ListActionControls,
	GenericToolName.TriggerActionControl,
	GenericToolName.SetCameraPosition,
	GenericToolName.GetScreenshot,
	GenericToolName.GetMetric,
];

const IN_SCOPE_GENERIC_TOOL_NAME_SET = new Set<string>(
	IN_SCOPE_GENERIC_TOOL_NAMES,
);

export function isInScopeGenericToolName(
	name: string,
): name is InScopeGenericToolName {
	return IN_SCOPE_GENERIC_TOOL_NAME_SET.has(name);
}

export const ASK_USER_QUESTION_TOOL_NAME = GenericToolName.AskUserQuestion;

function defaultGenericToolSettings(): Record<
	InScopeGenericToolName,
	GenericToolSettings
> {
	const settings = {} as Record<InScopeGenericToolName, GenericToolSettings>;
	for (const name of IN_SCOPE_GENERIC_TOOL_NAMES) {
		settings[name] = {name};
	}
	return settings;
}

const DEFAULT_GENERIC_TOOL_SETTINGS = defaultGenericToolSettings();

/** Default generic-tool settings: `{name}` only. Overlay fields come from `genericTools`. */
export function defaultSettingsFor<T extends InScopeGenericToolName>(
	name: T,
): Extract<GenericToolSettings, {name: T}> {
	return DEFAULT_GENERIC_TOOL_SETTINGS[name] as Extract<
		GenericToolSettings,
		{name: T}
	>;
}
