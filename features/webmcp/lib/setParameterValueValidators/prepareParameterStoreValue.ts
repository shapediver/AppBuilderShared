import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {DecomposedColorFormat} from "@AppBuilderLib/shared/lib/colors";
import {composeSdColor} from "@AppBuilderLib/shared/lib/colors";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {toStringListStoreValue} from "../stringListValue";
import type {ParameterValueInput, ParameterValuePrepareResult} from "./types";

const COLOR_ON_NON_COLOR_MESSAGE =
	"Color object value is only valid for Color parameters.";

function isColorObject(value: unknown): value is DecomposedColorFormat {
	return (
		typeof value === "object" &&
		value !== null &&
		"red" in value &&
		"green" in value &&
		"blue" in value &&
		"alpha" in value
	);
}

function invalidValueMessage(value: ParameterValueInput): string {
	return `Value ${JSON.stringify(value)} is not valid for parameter.`;
}

/**
 * Validates agent input and returns the store value ShapeDiver expects.
 */
export function prepareParameterStoreValue(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
): ParameterValuePrepareResult {
	const type = parameter.definition.type;

	if (isColorObject(value) && type !== ResParameterType.COLOR) {
		return {success: false, message: COLOR_ON_NON_COLOR_MESSAGE};
	}

	let storeValue: unknown;

	if (type === ResParameterType.COLOR && isColorObject(value)) {
		storeValue = composeSdColor(value);
	} else if (type === ResParameterType.STRINGLIST) {
		storeValue = toStringListStoreValue(value);
		if (storeValue === undefined) {
			return {success: false, message: invalidValueMessage(value)};
		}
	} else {
		storeValue = value;
	}

	if (!parameter.actions.isValid(storeValue, false)) {
		return {success: false, message: invalidValueMessage(value)};
	}

	return {success: true, storeValue};
}
