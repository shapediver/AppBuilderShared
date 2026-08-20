import {JSONSchema} from "zod/v4/core/json-schema.cjs";
import {
	AppBuilderActionType,
	IAppBuilderActionDefinition,
	type IAppBuilderControlActionRef,
} from "./appbuilder";

/** Names of generic tool definitions */
export type GenericToolName =
	| "list_parameter_definitions"
	| "get_parameter_values"
	| "set_parameter_values"
	| "list_action_controls"
	| "trigger_action_control"
	| "set_camera_position"
	| "get_screenshot"
	| "ask_user_question"
	| "get_metric";

/** Agent-specific reference for a parameter */
export interface IAgentParameterRef {
	/** Id or name or displayname of the referenced parameter (in that order). */
	name: string;

	/** Optional id of the session the referenced parameter belongs to. */
	sessionId?: string;

	/**
	 * Optional description of the parameter, providing further context to the agent.
	 */
	description?: string;
}

/**
 * Agent-specific reference for an action control.
 */
export interface IAgentActionControlRef {
	/**
	 * Id or label (in that order) of the action control that should be referenced.
	 * This considers all action controls available anywhere in the App Builder
	 * output, which are part of some controls widget.
	 * @see IAppBuilderWidgetPropsControls
	 * @see IAppBuilderControlActionRef
	 */
	name?: string;

	/**
	 * Optional embedded action control definition.
	 * If this is provided, the @see IAgentActionControlRef.name property will be ignored.
	 */
	action?: Required<Pick<IAppBuilderControlActionRef, "id">> &
		IAppBuilderControlActionRef;

	/**
	 * Optional description of the action, providing further context to the agent.
	 */
	description?: string;
}

type FilterValue = "include" | "exclude";

export type ListParameterDefinitionsToolSettings = {
	name: "list_parameter_definitions";

	/**
	 * Optional list of parameters that should be exposed to the agent.
	 * In case this list is not provided, parameters will be filtered
	 * based on the @see ListParameterDefinitionsToolSettings.filter property.
	 */
	parameters?: IAgentParameterRef[];

	/**
	 * Optional filter for parameters that should be exposed to the agent.
	 * This property is ignored if the @see ListParameterDefinitionsToolSettings.parameters property is provided.
	 */
	filter?: {
		/**
		 * Whether to include parameters whose "hidden" property is true.
		 * Defaults to "exclude" if not provided.
		 * @see https://help.shapediver.com/doc/inputs-and-outputs#Hiding-inputs-by-default
		 */
		hidden?: FilterValue;
		/**
		 * Whether to include parameters that are currently not exposed in the UI.
		 * We define "not exposed in the UI" as "referenced by some parameter control or accordion widget".
		 * This filter applies on top of the "hidden" filter.
		 * Defaults to "include" if not provided.
		 */
		invisible?: FilterValue;
		/**
		 * Which sessions' parameters should be exposed to the agent.
		 * If not provided, parameters of the controller session will be exposed.
		 */
		sessionIds?: string[];
	};
};

export type GetParameterValuesToolSettings = {
	name: "get_parameter_values";
};

export type SetParameterValuesToolSettings = {
	name: "set_parameter_values";
};

/**
 * Default `filter.types` for {@link ListActionControlsToolSettings} when
 * `actions` is omitted. Export actions are not included.
 */
export enum DefaultListActionControlType {
	CreateModelState = "createModelState",
	AddToCart = "addToCart",
	SetParameterValue = "setParameterValue",
	SetParameterValues = "setParameterValues",
	Undo = "undo",
	Redo = "redo",
	ResetParameterValues = "resetParameterValues",
	ImportModelState = "importModelState",
	Camera = "camera",
	Sound = "sound",
}

/**
 * The "list_actions" tool is used to expose a list of action controls to the agent.
 *
 * It's important to note the distinction between "action controls" and "actions".
 * Action controls are the UI elements that trigger actions, while actions are the
 * underlying operations that can be performed.
 *
 * The "list_actions" tool allows you to specify which action *controls* should be
 * available to the agent, either by providing a list of specific action controls or
 * by applying filters to determine which actions should be exposed.
 *
 * Depending on the type of action definition underlying the action control,
 * triggering the action might show a UI element to the user (e.g., a modal dialog
 * asking the user to paste a model state ID or URL).
 *
 * If we want to allow the agent to make use of underlying actions without showing
 * a UI element to the user, we can define and implement further generic tools
 * (e.g. "import_model_state"), or use specific tool definitions.
 * @see IAppBuilderAgent.specificTools
 */
export type ListActionControlsToolSettings = {
	name: "list_action_controls";

	/**
	 * Optional list of actions that should be exposed to the agent.
	 * In case this list is not provided, actions will be filtered
	 * based on the @see ListActionControlsToolSettings.filter property. The filter
	 * will be applied to all actions available anywhere in the App Builder
	 * output, as well as to actions available via default toolbars.
	 */
	actions?: IAgentActionControlRef[];

	/**
	 * Optional filter for actions that should be exposed to the agent.
	 * This property is ignored if the @see ListActionControlsToolSettings.actions property is provided.
	 */
	filter?: {
		/**
		 * The types of actions that should be exposed to the agent.
		 * Defaults to {@link DefaultListActionControlType}.
		 */
		types?: AppBuilderActionType[];
	};
};

export type TriggerActionControlToolSettings = {
	name: "trigger_action_control";
};

export type SetCameraPositionToolSettings = {
	name: "set_camera_position";
};

export type GetScreenshotToolSettings = {
	name: "get_screenshot";
};

export type AskUserQuestionToolSettings = {
	name: "ask_user_question";
};

export type GetMetricToolSettings = {
	name: "get_metric";
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

/**
 * Settings of a tool to be executed remotely, typically by an API call,
 * the Agent2Agent protocol, model context protocol (MCP), etc.
 * To be defined.
 */
export interface RemoteToolExecutionSettings {}

export interface SpecificToolSettings {
	/** Name of the tool. Use snake case. */
	name: string;

	/** Optional description of the tool, providing context to the agent. */
	description?: string;

	/**
	 * Input schema for the tool.
	 */
	inputSchema: JSONSchema;

	/**
	 * Optional sequence of actions that should be run when the tool is triggered.
	 * Information about these actions will not be exposed to the agent.
	 * Values from the @see SpecificToolSettings.inputSchema can be mapped to the action
	 * properties using the "agentTool" parameter value source.
	 * @see IAppBuilderParameterValueSourcePropsAgentTool
	 */
	actionSequence?: IAppBuilderActionDefinition[];

	/**
	 * Optional remote execution settings for the tool.
	 * Will be ignored if actionSequence is provided.
	 */
	remoteExecution?: RemoteToolExecutionSettings;
}

/**
 * Definition of an agent that can be used with App Builder.
 */
export interface IAppBuilderAgent {
	/** Unique identifier of the agent. */
	id: string;

	/** Display name of the agent (exposed to the user). */
	name: string;

	/** The agent's system prompt. */
	message: string;

	/**
	 * Boolean indicating whether all available generic tools shall be exposed
	 * using their default settings.
	 * Default is true.
	 * If this is set to true, settings for individual generic tools can be overridden by
	 * including them in the genericTools property.
	 * If this is set to false, only the generic tools included in the genericTools
	 * property will be available to the agent.
	 */
	useGenericToolDefaults?: boolean;

	/** Settings of the generic tools that should be available to the agent. */
	genericTools?: GenericToolSettings[];

	/** Definition of specific tools that should be available to the agent. */
	specificTools?: SpecificToolSettings[];
}
