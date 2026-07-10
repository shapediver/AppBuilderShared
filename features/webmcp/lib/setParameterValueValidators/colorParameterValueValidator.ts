import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {composeSdColor} from "@AppBuilderLib/shared/lib/colors";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {isColorObject} from "./isColorObject";
import type {ParameterValueInput, ParameterValuePrepareResult} from "./types";

export function getColorValidationErrorMessage(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
): string {
	const type = parameter.definition.type;

	if (!isColorObject(value)) {
		return `Value type does not match parameter type ${type}.`;
	}

	return `New color ${JSON.stringify(value)} is not valid for parameter.`;
}

export function prepareColorParameterValue(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
): ParameterValuePrepareResult {
	const type = parameter.definition.type;

	if (!isColorObject(value)) {
		return {
			success: false,
			message: `Value type does not match parameter type ${type}.`,
		};
	}

	const storeValue = composeSdColor(value);
	if (!parameter.actions.isValid(storeValue, false)) {
		return {
			success: false,
			message: getColorValidationErrorMessage(parameter, value),
		};
	}

	return {success: true, storeValue};
}

export function isColorParameterType(type: string): boolean {
	return type === ResParameterType.COLOR;
}
