import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	isBoolParameterType,
	prepareBoolParameterValue,
} from "./boolParameterValueValidator";
import {
	isColorParameterType,
	prepareColorParameterValue,
} from "./colorParameterValueValidator";
import {isColorObject} from "./isColorObject";
import {
	isNumericParameterType,
	prepareNumericParameterValue,
} from "./numericParameterValueValidator";
import {prepareStringListParameterValue} from "./stringListParameterValueValidator";
import {
	isStringParameterType,
	prepareStringParameterValue,
} from "./stringParameterValueValidator";
import type {ParameterValueInput, ParameterValuePrepareResult} from "./types";

const COLOR_ON_NON_COLOR_MESSAGE =
	"Color object value is only valid for Color parameters.";

/**
 * Validates agent input and returns the store value ShapeDiver expects.
 */
export function prepareParameterStoreValue(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
): ParameterValuePrepareResult {
	const type = parameter.definition.type;

	if (isColorObject(value) && !isColorParameterType(type)) {
		return {success: false, message: COLOR_ON_NON_COLOR_MESSAGE};
	}

	if (isColorParameterType(type)) {
		return prepareColorParameterValue(parameter, value);
	}

	if (type === ResParameterType.STRINGLIST) {
		return prepareStringListParameterValue(parameter, value);
	}

	if (isBoolParameterType(type)) {
		return prepareBoolParameterValue(parameter, value);
	}

	if (isStringParameterType(type)) {
		return prepareStringParameterValue(parameter, value);
	}

	if (isNumericParameterType(type)) {
		return prepareNumericParameterValue(parameter, value);
	}

	if (!parameter.actions.isValid(value, false)) {
		return {
			success: false,
			message: `Value ${value} is not valid for parameter.`,
		};
	}

	return {success: true, storeValue: value};
}
