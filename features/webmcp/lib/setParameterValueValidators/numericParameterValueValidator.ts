import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import type {ParameterValueInput, ParameterValuePrepareResult} from "./types";

const NUMERIC_PARAMETER_TYPES: ResParameterType[] = [
	ResParameterType.EVEN,
	ResParameterType.ODD,
	ResParameterType.INT,
	ResParameterType.FLOAT,
];

export function isNumericParameterType(type: string): boolean {
	return NUMERIC_PARAMETER_TYPES.includes(type as ResParameterType);
}

export function getNumericValidationErrorMessage(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
): string {
	const def = parameter.definition;
	const type = def.type;

	if (typeof value !== "number") {
		return `Value type does not match parameter type ${type}.`;
	}

	const min = def.min ?? null;
	const max = def.max ?? null;

	return `Value ${value} is out of range [${min}, ${max}].`;
}

export function prepareNumericParameterValue(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
): ParameterValuePrepareResult {
	const type = parameter.definition.type;

	if (typeof value !== "number") {
		return {
			success: false,
			message: `Value type does not match parameter type ${type}.`,
		};
	}

	if (!parameter.actions.isValid(value, false)) {
		return {
			success: false,
			message: getNumericValidationErrorMessage(parameter, value),
		};
	}

	return {success: true, storeValue: value};
}
