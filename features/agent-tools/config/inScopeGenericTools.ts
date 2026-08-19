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

export const IN_SCOPE_GENERIC_TOOL_NAMES = [
	"list_parameter_definitions",
	"get_parameter_values",
	"set_parameter_values",
	"list_action_controls",
	"trigger_action_control",
	"set_camera_position",
	"get_screenshot",
	"get_metric",
] as const;

export type InScopeGenericToolName =
	(typeof IN_SCOPE_GENERIC_TOOL_NAMES)[number];

export function isInScopeGenericToolName(
	name: string,
): name is InScopeGenericToolName {
	return (IN_SCOPE_GENERIC_TOOL_NAMES as readonly string[]).includes(name);
}

export const ASK_USER_QUESTION_TOOL_NAME: GenericToolName = "ask_user_question";

export function defaultSettingsFor(
	name: InScopeGenericToolName,
): GenericToolSettings {
	switch (name) {
		case "list_parameter_definitions":
			return {name} satisfies ListParameterDefinitionsToolSettings;
		case "get_parameter_values":
			return {name} satisfies GetParameterValuesToolSettings;
		case "set_parameter_values":
			return {name} satisfies SetParameterValuesToolSettings;
		case "list_action_controls":
			return {name} satisfies ListActionControlsToolSettings;
		case "trigger_action_control":
			return {name} satisfies TriggerActionControlToolSettings;
		case "set_camera_position":
			return {name} satisfies SetCameraPositionToolSettings;
		case "get_screenshot":
			return {name} satisfies GetScreenshotToolSettings;
		case "get_metric":
			return {name} satisfies GetMetricToolSettings;
	}
}
