import {GenericToolName} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";

/** Generic tools Step 1 exposes. Excludes `GenericToolName.AskUserQuestion`. */
export enum InScopeGenericToolName {
	ListParameterDefinitions = GenericToolName.ListParameterDefinitions,
	GetParameterValues = GenericToolName.GetParameterValues,
	SetParameterValues = GenericToolName.SetParameterValues,
	ListActionControls = GenericToolName.ListActionControls,
	TriggerActionControl = GenericToolName.TriggerActionControl,
	SetCameraPosition = GenericToolName.SetCameraPosition,
	GetScreenshot = GenericToolName.GetScreenshot,
	GetMetric = GenericToolName.GetMetric,
}

export const IN_SCOPE_GENERIC_TOOL_NAMES: InScopeGenericToolName[] =
	Object.values(InScopeGenericToolName);

export function isInScopeGenericToolName(
	name: string,
): name is InScopeGenericToolName {
	return IN_SCOPE_GENERIC_TOOL_NAMES.includes(name as InScopeGenericToolName);
}

export const ASK_USER_QUESTION_TOOL_NAME = GenericToolName.AskUserQuestion;

/** Default generic-tool settings: `{name}` only. Overlay fields come from `genericTools`. */
export function defaultSettingsFor(name: InScopeGenericToolName): {
	name: InScopeGenericToolName;
} {
	return {name};
}
