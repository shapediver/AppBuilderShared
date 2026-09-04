import type {AppBuilderActionType} from "./appBuilderActionType";
import type {DefaultListActionControlType} from "@AppBuilderLib/features/agent-tools/config/listActionControls";
import type {JsonValue} from "@AppBuilderLib/shared/lib/jsonValue";

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

export type FilterValue = "include" | "exclude";

/** Agent-specific reference for a parameter */
export interface IAgentParameterRef {
	name: string;
	sessionId?: string;
	description?: string;
}

/** Agent-specific reference for an action control */
export interface IAgentActionControlRef {
	name?: string;
	action?: {
		id: string;
		definition: any;
		[key: string]: any;
	};
	description?: string;
}

export type ListParameterDefinitionsToolSettings = {
	name: GenericToolName.ListParameterDefinitions;
	parameters?: IAgentParameterRef[];
	filter?: {
		hidden?: FilterValue;
		invisible?: FilterValue;
		sessionIds?: string[];
	};
};

export type GetParameterValuesToolSettings = {
	name: GenericToolName.GetParameterValues;
};

export type SetParameterValuesToolSettings = {
	name: GenericToolName.SetParameterValues;
};

export type ListActionControlsToolSettings = {
	name: GenericToolName.ListActionControls;
	actions?: IAgentActionControlRef[];
	filter?: {
		types?: AppBuilderActionType[];
	};
};

export type TriggerActionControlToolSettings = {
	name: GenericToolName.TriggerActionControl;
};

export type SetCameraPositionToolSettings = {
	name: GenericToolName.SetCameraPosition;
};

export type GetScreenshotToolSettings = {
	name: GenericToolName.GetScreenshot;
};

export type AskUserQuestionToolSettings = {
	name: GenericToolName.AskUserQuestion;
};

export type GetMetricToolSettings = {
	name: GenericToolName.GetMetric;
};

export type GenericToolSettings =
	| ListParameterDefinitionsToolSettings
	| GetParameterValuesToolSettings
	| SetParameterValuesToolSettings
	| ListActionControlsToolSettings
	| TriggerActionControlToolSettings
	| SetCameraPositionToolSettings
	| GetScreenshotToolSettings
	| AskUserQuestionToolSettings
	| GetMetricToolSettings;

export interface RemoteToolExecutionSettings {}

export interface SpecificToolSettings {
	name: string;
	description?: string;
	inputSchema: Record<string, JsonValue>;
	actionSequence?: any[];
	remoteExecution?: RemoteToolExecutionSettings;
}

export interface IAppBuilderAgent {
	id: string;
	name: string;
	message: string;
	useGenericToolDefaults?: boolean;
	genericTools?: GenericToolSettings[];
	specificTools?: SpecificToolSettings[];
}

