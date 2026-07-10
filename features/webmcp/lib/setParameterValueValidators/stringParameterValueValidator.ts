import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import type {ParameterValueInput, ParameterValuePrepareResult} from "./types";

export function getStringValidationErrorMessage(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
): string {
	const def = parameter.definition;
	const type = def.type;

	if (typeof value !== "string") {
		return `Value type does not match parameter type ${type}.`;
	}

	return `String value exceeds maximum length of ${def.max}.`;
}

export function prepareStringParameterValue(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
): ParameterValuePrepareResult {
	const type = parameter.definition.type;

	if (typeof value !== "string") {
		return {
			success: false,
			message: `Value type does not match parameter type ${type}.`,
		};
	}

	if (!parameter.actions.isValid(value, false)) {
		return {
			success: false,
			message: getStringValidationErrorMessage(parameter, value),
		};
	}

	return {success: true, storeValue: value};
}

export function isStringParameterType(type: string): boolean {
	return type === ResParameterType.STRING;
}
