import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {DecomposedColorFormat} from "@AppBuilderLib/shared/lib/colors";
import {composeSdColor} from "@AppBuilderLib/shared/lib/colors";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {toStringListStoreValue} from "../stringListValue";
import type {ParameterValueInput, ParameterValuePrepareResult} from "./types";

const COLOR_ON_NON_COLOR_MESSAGE =
	"Color object value is only valid for Color parameters.";

const NUMERIC_TYPES: ResParameterType[] = [
	ResParameterType.INT,
	ResParameterType.FLOAT,
	ResParameterType.EVEN,
	ResParameterType.ODD,
];

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

/**
 * Type-specific hint appended to the invalid-value message so weak models can self-correct.
 * Uses only definition metadata — the validity check stays `parameter.actions.isValid`.
 */
function parameterHint(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
): string {
	const def = parameter.definition;
	const type = def.type as ResParameterType;
	if (type === ResParameterType.STRINGLIST) {
		const choices = def.choices ?? [];
		return ` Use a 0-based integer index (0..${Math.max(choices.length - 1, 0)}). Choices: ${JSON.stringify(choices)}.`;
	}
	if (NUMERIC_TYPES.includes(type)) {
		const min = def.min ?? Number.NEGATIVE_INFINITY;
		const max = def.max ?? Number.POSITIVE_INFINITY;
		return ` Use a number in range [${min}, ${max}].`;
	}
	if (type === ResParameterType.COLOR) {
		return " Use a color object {red, green, blue, alpha} (0-255).";
	}
	if (type === ResParameterType.BOOL) {
		return " Use a boolean.";
	}
	if (type === ResParameterType.STRING) {
		return def.max !== undefined
			? ` Use a string of length <= ${def.max}.`
			: " Use a string.";
	}
	// Unknown / unsupported type: surface the canonical validator message
	// (parameter.actions.isValid in throw mode) rather than no hint at all.
	const detail = canonicalValidatorMessage(parameter, value);
	return detail
		? ` ${detail}`
		: " Use a value valid for this parameter type.";
}

/** Extracts the canonical error message from `parameter.actions.isValid` (throw mode). */
function canonicalValidatorMessage(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
): string {
	try {
		parameter.actions.isValid(value, true);
		return "";
	} catch (e) {
		return e instanceof Error ? e.message : String(e);
	}
}

function invalidValueMessage(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
): string {
	const def = parameter.definition;
	const name = def.displayname || def.name;
	return `Value ${JSON.stringify(value)} is not valid for parameter "${name}" (${def.type}).${parameterHint(parameter, value)}`;
}

/**
 * Validates agent input and returns the store value ShapeDiver expects.
 * The validity check is delegated to `parameter.actions.isValid`; only input
 * shaping (Color object, StringList index) and agent-friendly error messages
 * live here.
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
			return {
				success: false,
				message: invalidValueMessage(parameter, value),
			};
		}
	} else {
		storeValue = value;
	}

	if (!parameter.actions.isValid(storeValue, false)) {
		return {success: false, message: invalidValueMessage(parameter, value)};
	}

	return {success: true, storeValue};
}
