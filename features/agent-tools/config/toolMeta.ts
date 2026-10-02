import {GenericToolName} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import type {InScopeGenericToolName} from "./inScopeGenericTools";

export type AgentToolMeta = {
	description: string;
	annotations: {
		readOnlyHint: boolean;
	};
};

export const AGENT_TOOL_META: Record<InScopeGenericToolName, AgentToolMeta> = {
	[GenericToolName.ListParameterDefinitions]: {
		description:
			"Read configurator parameters before changing anything. " +
			"Call with no arguments. Which parameters appear is agent settings, not a tool argument. " +
			"Returns { parameters: [...], errors?: [{ name, message }] } with id, name, namespace (session id), type, settable, choices/min/max, currentValue, and description when the agent settings provide one. " +
			"settable=false means read-only via set_parameter_values (unsupported type). " +
			"Trust type over display name (e.g. name Color may still be StringList).",
		annotations: {readOnlyHint: true},
	},
	[GenericToolName.GetParameterValues]: {
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
	[GenericToolName.SetParameterValues]: {
		description:
			"Change configurator parameters. " +
			"Input shape: { updates: [{ name, value }] } — use updates and name, not parameters/id. " +
			"Value rules: Bool=boolean; Int/Float/Even/Odd=number in range; String=text; " +
			"StringList=0-based integer index only (1 = second choice), never the label and never {index:N}; " +
			"Color={red,green,blue,alpha} 0-255. " +
			"Returns { applied: string[], errors: [{ name, message }] }. Valid updates still apply when others fail.",
		annotations: {readOnlyHint: false},
	},
	[GenericToolName.ListActionControls]: {
		description:
			"List action controls the agent may trigger. " +
			"Call with no arguments. Which actions appear is agent settings, not a tool argument. " +
			"Returns { actions: [{ id, name, type, description? }], errors?: [{ name, message }] }. " +
			"Use name with trigger_action_control.",
		annotations: {readOnlyHint: true},
	},
	[GenericToolName.TriggerActionControl]: {
		description:
			"Run an action control without mounting App Builder UI. " +
			"Input: { name } — id or name from list_action_controls. " +
			"Success: { success: true }. Failure: { success: false, message }. " +
			"Unsupported action types return message 'not supported'.",
		annotations: {readOnlyHint: false},
	},
	[GenericToolName.SetCamera]: {
		description:
			"Set the active viewport camera. " +
			"Input fields are optional: { position?: [x,y,z], target?: [x,y,z], type?, fov?, direction?, id?, name? }. " +
			"Omit id and name to update the active camera. With neither, a different type creates a camera of that type. An id or name selects that camera. " +
			"Uses the main viewport. " +
			"Success: { success: true }. Failure: { success: false, message } (e.g. Viewport not found).",
		annotations: {readOnlyHint: false},
	},
	[GenericToolName.GetCamera]: {
		description:
			"Read the active viewport camera. " +
			"Call with no arguments. Uses the main viewport. " +
			"Success: { success: true, camera } with id, type, position [x,y,z], target [x,y,z], and fov or direction. " +
			"camera is the App Builder camera document. " +
			"Failure: { success: false, message } (e.g. Viewport not found).",
		annotations: {readOnlyHint: true},
	},
	[GenericToolName.GetScreenshot]: {
		description:
			"Capture a screenshot of the 3D viewport as a data URL. " +
			'Input: { contentType?: "image/png" | "image/jpeg", quality?: 0-1, resolution?: {width, height} }. ' +
			"All fields optional; omit them for the current viewport. Uses the main viewport. " +
			"Success: { success: true, image_url } with a data URL. Failure: { success: false, message }.",
		annotations: {readOnlyHint: true},
	},
	[GenericToolName.GetMetric]: {
		description:
			"Read the model's AgentMetric data output. " +
			"Call with no arguments. " +
			"If the output exists: { found: true, value } where value is the output content. " +
			"If missing: { found: false }.",
		annotations: {readOnlyHint: true},
	},
};
