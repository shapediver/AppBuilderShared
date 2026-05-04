import {PARAMETER_TYPE} from "@shapediver/viewer.session";

export interface ResolveParameterExportValueInput {
	definitionType: string;
	execValue: unknown;
	stringExecValue: () => string;
}

/**
 * Value serialized into "export parameter values" JSON.
 * File parameters must use the uploaded file id string, not execValue (often non-JSON / {}).
 */
export function resolveParameterExportValue(
	input: ResolveParameterExportValueInput,
): unknown {
	if (input.definitionType === PARAMETER_TYPE.FILE) {
		return input.stringExecValue();
	}
	return input.execValue;
}
