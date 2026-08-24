import {InScopeGenericToolName} from "./inScopeGenericTools";

export type AgentToolMeta = {
	description: string;
	annotations: {
		readOnlyHint: boolean;
	};
};

export const AGENT_TOOL_META: Record<InScopeGenericToolName, AgentToolMeta> = {
	list_parameter_definitions: {
		description:
			"Read configurator parameters before changing anything. " +
			"Call with no arguments. Which parameters appear is agent settings, not a tool argument. " +
			"Returns { parameters: [...], errors?: [{ name, message }] } with id, name, namespace (session id), type, settable, choices/min/max, currentValue. " +
			"settable=false means read-only via set_parameter_values (unsupported type). " +
			"Trust type over display name (e.g. name Color may still be StringList).",
		annotations: {readOnlyHint: true},
	},
	get_parameter_values: {
		description:
			"Read current values of configurator parameters exposed to the agent. " +
			"Input: { names?: string[], namespace?: string }. " +
			"Omit names to read all exposed parameters; names match id, name, or displayname. " +
			"Omit namespace for no extra session filter (agent definition still applies). " +
			"Returns { values: [{ id, name, displayname, namespace, currentValue }], errors?: [{ name, message }] }. " +
			"Unknown names are listed in errors; found names still appear in values. " +
			"On invalid input, returns { values: [], errors: [{ name: '*', message }] }.",
		annotations: {readOnlyHint: true},
	},
	set_parameter_values: {
		description:
			"Change configurator parameters. " +
			"Input shape: { updates: [{ name, value }] } — use updates and name, not parameters/id. " +
			"Value rules: Bool=boolean; Int/Float/Even/Odd=number in range; String=text; " +
			"StringList=0-based integer index only (1 = second choice), never the label and never {index:N}; " +
			"Color={red,green,blue,alpha} 0-255. " +
			"Returns { applied: string[], errors: [{ name, message }] }. Valid updates still apply when others fail.",
		annotations: {readOnlyHint: false},
	},
	list_action_controls: {
		description:
			"List action controls the agent may trigger. " +
			"Call with no arguments. Which actions appear is agent settings, not a tool argument. " +
			"Returns { actions: [{ id, name, type, description? }], errors?: [{ name, message }] }. " +
			"Use name with trigger_action_control.",
		annotations: {readOnlyHint: true},
	},
	trigger_action_control: {
		description:
			"Run an action control without mounting App Builder UI. " +
			"Input: { name } — id or name from list_action_controls. " +
			"Success: { success: true }. Failure: { success: false, message }. " +
			"Unsupported action types return message 'not supported'.",
		annotations: {readOnlyHint: false},
	},
	set_camera_position: {
		description:
			"Set the viewport camera position and look-at target. " +
			"Input: { position: {x,y,z}, target: {x,y,z} }. Uses the main viewport. " +
			"Does not change camera type. " +
			"Success: { success: true }. Failure: { success: false, message } (e.g. Viewport not found).",
		annotations: {readOnlyHint: false},
	},
	get_screenshot: {
		description:
			"Capture a screenshot of the 3D viewport as a data URL. " +
			"Call with no arguments. Uses the main viewport. " +
			"Success: { success: true, image } with a data URL. Failure: { success: false, message }.",
		annotations: {readOnlyHint: true},
	},
	get_metric: {
		description:
			"Read the model's AgentMetric data output. " +
			"Call with no arguments. " +
			"If the output exists: { found: true, value } where value is the output content. " +
			"If missing: { found: false }.",
		annotations: {readOnlyHint: true},
	},
};
