import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {parseStringListIndex, toStringListStoreValue} from "../stringListValue";
import type {ParameterValueInput, ParameterValuePrepareResult} from "./types";

export function getStringListValidationErrorMessage(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
): string {
	const def = parameter.definition;
	const type = def.type;
	const index = parseStringListIndex(value);

	if (index === undefined) {
		return `Value type does not match parameter type ${type}. Use a 0-based integer index.`;
	}

	const choices = def.choices ?? [];

	return `Index ${index} is not valid (choices: 0..${Math.max(choices.length - 1, 0)}).`;
}

export function prepareStringListParameterValue(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
): ParameterValuePrepareResult {
	const type = parameter.definition.type;
	const storeValue = toStringListStoreValue(value);

	if (storeValue === undefined) {
		return {
			success: false,
			message: `Value type does not match parameter type ${type}. Use a 0-based integer index.`,
		};
	}

	if (!parameter.actions.isValid(storeValue, false)) {
		return {
			success: false,
			message: getStringListValidationErrorMessage(parameter, value),
		};
	}

	return {success: true, storeValue};
}
