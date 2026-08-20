import type {
	GenericToolName,
	GenericToolSettings,
	GetMetricToolSettings,
	GetParameterValuesToolSettings,
	GetScreenshotToolSettings,
	ListActionControlsToolSettings,
	ListParameterDefinitionsToolSettings,
	SetCameraPositionToolSettings,
	SetParameterValuesToolSettings,
	TriggerActionControlToolSettings,
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
	switch (name) {
		case InScopeGenericToolName.ListParameterDefinitions:
			return {
				name: InScopeGenericToolName.ListParameterDefinitions,
			} satisfies ListParameterDefinitionsToolSettings;
		case InScopeGenericToolName.GetParameterValues:
			return {
				name: InScopeGenericToolName.GetParameterValues,
			} satisfies GetParameterValuesToolSettings;
		case InScopeGenericToolName.SetParameterValues:
			return {
				name: InScopeGenericToolName.SetParameterValues,
			} satisfies SetParameterValuesToolSettings;
		case InScopeGenericToolName.ListActionControls:
			return {
				name: InScopeGenericToolName.ListActionControls,
			} satisfies ListActionControlsToolSettings;
		case InScopeGenericToolName.TriggerActionControl:
			return {
				name: InScopeGenericToolName.TriggerActionControl,
			} satisfies TriggerActionControlToolSettings;
		case InScopeGenericToolName.SetCameraPosition:
			return {
				name: InScopeGenericToolName.SetCameraPosition,
			} satisfies SetCameraPositionToolSettings;
		case InScopeGenericToolName.GetScreenshot:
			return {
				name: InScopeGenericToolName.GetScreenshot,
			} satisfies GetScreenshotToolSettings;
		case InScopeGenericToolName.GetMetric:
			return {
				name: InScopeGenericToolName.GetMetric,
			} satisfies GetMetricToolSettings;
	}
}
