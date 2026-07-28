export const LIST_SESSIONS_TOOL_NAME = "list_sessions";

export const LIST_PARAMETER_DEFINITIONS_TOOL_NAME =
	"list_parameter_definitions";

export const SET_PARAMETER_VALUES_TOOL_NAME = "set_parameter_values";

export const CREATE_MODEL_STATE_TOOL_NAME = "create_model_state";

export const IMPORT_MODEL_STATE_TOOL_NAME = "import_model_state";

export const LIST_SESSIONS_TOOL_DESCRIPTION =
	"List ids of sessions which offer parameters.";

export const LIST_PARAMETER_DEFINITIONS_TOOL_DESCRIPTION =
	"Get definitions of parameters whose values can be updated to change the state of the 3D configurator. " +
	"Optional filter (all | visible), search (case-insensitive substring over id/name/displayname), limit (default 20, max 100), offset (default 0, for pagination), and sessionId; omit sessionId to list all sessions. " +
	"Only filter, sessionId, search, limit, offset are accepted as input — do NOT send group, sort, or any other key; the schema rejects unknown keys. " +
	'Prefer narrow `search` and a small `limit` over fetching all parameters — use search whenever you know a parameter name fragment or a target keyword (e.g. search="prong", search="metal", search="stone"). ' +
	"Only call with filter=all and no search when you must enumerate every parameter (e.g. reset, audit, or unknown target); paginate with offset+limit if needed. " +
	"When results are truncated (structuredContent.truncated=true), fetch the next page with offset=offset+limit, or refine search to narrow. " +
	"Each parameter has a `howto` field stating the exact value format set_parameter_values expects. " +
	"Trust `type` over the display name (e.g. a parameter named Color may still be StringList). " +
	"`settable=false` means read-only via set_parameter_values (unsupported type).";

export const SET_PARAMETER_VALUES_TOOL_DESCRIPTION =
	"Set values of parameters, trigger execution, and wait for the 3D configurator to update. " +
	"Input uses updates [{ name, value, sessionId? }] — use the field `updates` and `name`, not `parameters` or `id`. " +
	"Read each parameter's `howto` from list_parameter_definitions for the exact value format per type (index vs label vs number vs color object). " +
	"Valid updates still apply when others fail. " +
	"If a user request is ambiguous (e.g. 'gold' when multiple gold variants exist, or a stone name that appears in multiple parameters), ask the user to clarify which parameter and which choice before calling set_parameter_values. " +
	"For relative changes ('wider', 'larger', 'smaller'), read currentValue from list_parameter_definitions first and pick a moderate change; do not jump to min or max.";

export const CREATE_MODEL_STATE_TOOL_DESCRIPTION =
	"Create a unique identifier for the current state of the 3D configurator. " +
	"Optional includeImage, includeGltf, parameterNamesToInclude, parameterNamesToExclude, data. " +
	"Use includeImage:false when no preview screenshot is needed; includeGltf:true only when a GLTF export is required. " +
	"The returned modelStateId is required for import_model_state.";

export const IMPORT_MODEL_STATE_TOOL_DESCRIPTION =
	"Load configurator state from a modelStateId and wait for the update to complete. " +
	"Input: { modelStateId } from create_model_state (or URL containing modelStateId). " +
	"Use list_parameter_definitions after import to verify currentValue.";
