export const LIST_PARAMETER_DEFINITIONS_TOOL_NAME =
	"list_parameter_definitions";

export const SET_PARAMETER_VALUES_TOOL_NAME = "set_parameter_values";

export const CREATE_MODEL_STATE_TOOL_NAME = "create_model_state";

export const IMPORT_MODEL_STATE_TOOL_NAME = "import_model_state";

export const LIST_PARAMETER_DEFINITIONS_TOOL_DESCRIPTION =
	"Read configurator parameters before changing anything. " +
	"Input: { filter?: 'all' | 'visible' } — field name is filter, not visibleOnly. " +
	"Returns { parameters: [...], errors?: [{ name, message }] } with id, name, type, settable, choices/min/max, currentValue. " +
	"settable=false means read-only via set_parameter_values (unsupported type). " +
	"On invalid input, returns { parameters: [], errors: [{ name: '*', message }] }. " +
	"Trust type over display name (e.g. name Color may still be StringList). " +
	"Call with filter=all first when you do not know parameter names or value rules.";

export const SET_PARAMETER_VALUES_TOOL_DESCRIPTION =
	"Change configurator parameters. " +
	"Input shape: { updates: [{ name, value }] } — use updates and name, not parameters/id. " +
	"Value rules: Bool=boolean; Int/Float/Even/Odd=number in range; String=text; " +
	"StringList=0-based integer index only (1 = second choice), never the label and never {index:N}; " +
	"Color={red,green,blue,alpha} 0-255. " +
	"Returns { applied: string[], errors: [{ name, message }] }. Valid updates still apply when others fail.";

export const CREATE_MODEL_STATE_TOOL_DESCRIPTION =
	"Save current configurator state for sharing or later restore via import_model_state. " +
	"Input: { includeImage?: boolean, includeGltf?: boolean, parameterNamesToInclude?: string[], parameterNamesToExclude?: string[], data?: object }. " +
	"Use includeImage:false when no preview screenshot is needed; includeGltf:true only when a GLTF export is required. " +
	"Success: { success: true, modelStateId: string, modelViewUrl: string, modelStateImageUrl?: string, modelStateGltfUrl?: string, modelStateUsdzUrl?: string }. " +
	"modelStateId is required for import_model_state. Image/GLTF/USDZ URL fields appear only when the matching include* flag was true. " +
	"Failure: { success: false, error: string }.";

export const IMPORT_MODEL_STATE_TOOL_DESCRIPTION =
	"Restore a saved configuration. " +
	"Input: { modelStateId } from create_model_state (or URL containing modelStateId). " +
	"Waits for session update before returning. " +
	"Success: { success: true, appliedParameterIds: string[], invalidParameters?: [{ name, message }] } — appliedParameterIds lists parameter ids whose values changed during import (empty array when none changed). " +
	"invalidParameters appears on partial success when some saved parameters could not be applied. " +
	"Failure: { success: false, message: string, invalidParameters?: [{ name, message }] } — per-parameter reasons when saved state does not match current model. " +
	"Use list_parameter_definitions after import to verify currentValue.";
