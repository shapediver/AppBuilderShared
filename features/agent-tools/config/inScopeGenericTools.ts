import type {
	GenericToolName,
	GenericToolSettings,
} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";

/** Generic tools Step 1 exposes. Excludes `ask_user_question`. */
export enum InScopeGenericToolName {
	ListParameterDefinitions = "list_parameter_definitions",
	GetParameterValues = "get_parameter_values",
	SetParameterValues = "set_parameter_values",
	ListActionControls = "list_action_controls",
	TriggerActionControl = "trigger_action_control",
	SetCameraPosition = "set_camera_position",
	GetScreenshot = "get_screenshot",
	GetMetric = "get_metric",
}

export const IN_SCOPE_GENERIC_TOOL_NAMES: InScopeGenericToolName[] =
	Object.values(InScopeGenericToolName);

export function isInScopeGenericToolName(
	name: string,
): name is InScopeGenericToolName {
	return IN_SCOPE_GENERIC_TOOL_NAMES.includes(name as InScopeGenericToolName);
}

export const ASK_USER_QUESTION_TOOL_NAME: GenericToolName = "ask_user_question";

export function defaultSettingsFor(
	name: InScopeGenericToolName,
): GenericToolSettings {
	return {name} as GenericToolSettings;
}
