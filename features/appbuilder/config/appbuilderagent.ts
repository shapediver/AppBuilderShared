/** Names of generic tool definitions */
export enum GenericToolName {
	ListParameterDefinitions = "list_parameter_definitions",
	GetParameterValues = "get_parameter_values",
	SetParameterValues = "set_parameter_values",
	ListActionControls = "list_action_controls",
	TriggerActionControl = "trigger_action_control",
	SetCameraPosition = "set_camera_position",
	GetScreenshot = "get_screenshot",
	AskUserQuestion = "ask_user_question",
	GetMetric = "get_metric",
}

export type {DefaultListActionControlType} from "@AppBuilderLib/features/agent-tools/config/listActionControls";

export type {
	AskUserQuestionToolSettings,
	GenericToolSettings,
	GetMetricToolSettings,
	GetParameterValuesToolSettings,
	GetScreenshotToolSettings,
	IAgentActionControlRef,
	IAgentParameterRef,
	IAppBuilderAgent,
	ListActionControlsToolSettings,
	ListParameterDefinitionsToolSettings,
	RemoteToolExecutionSettings,
	SetCameraPositionToolSettings,
	SetParameterValuesToolSettings,
	SpecificToolSettings,
	TriggerActionControlToolSettings,
} from "./appbuildertypecheck";
