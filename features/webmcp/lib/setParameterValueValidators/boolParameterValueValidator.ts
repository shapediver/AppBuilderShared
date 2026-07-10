import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import type {ParameterValueInput, ParameterValuePrepareResult} from "./types";

export function getBoolValidationErrorMessage(
	parameter: IShapeDiverParameter<any>,
	_value: ParameterValueInput,
): string {
	return `Value type does not match parameter type ${parameter.definition.type}.`;
}

export function prepareBoolParameterValue(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
): ParameterValuePrepareResult {
	if (typeof value !== "boolean") {
		return {
			success: false,
			message: getBoolValidationErrorMessage(parameter, value),
		};
	}

	if (!parameter.actions.isValid(value, false)) {
		return {
			success: false,
			message: `Value ${value} is not valid for parameter.`,
		};
	}

	return {success: true, storeValue: value};
}

export function isBoolParameterType(type: string): boolean {
	return type === ResParameterType.BOOL;
}
