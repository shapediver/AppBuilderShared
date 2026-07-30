import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {DecomposedColorFormat} from "@AppBuilderLib/shared/lib/colors";
import {composeSdColor} from "@AppBuilderLib/shared/lib/colors";
import type {z} from "@AppBuilderLib/shared/lib/zod";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {parameterValueSchema} from "../../core/listParameterDefinitions";
import {howtoForParameterType, isHowtoTypeKnown} from "../parameterHowto";
import {toStringListStoreValue} from "../stringListValue";

type ParameterValueInput = z.infer<typeof parameterValueSchema>;

type ParameterValuePrepareResult =
	| {success: true; storeValue: unknown}
	| {success: false; message: string};

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

/**
 * Type-specific hint appended to the invalid-value message so weak models can self-correct.
 * Uses only definition metadata — the validity check stays `parameter.actions.isValid`.
 */
function parameterHint(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
): string {
	const def = parameter.definition;
	if (isHowtoTypeKnown(def.type)) {
		return ` ${howtoForParameterType(def)}`;
	}
	// Unknown / unsupported type: surface the canonical validator message
	// (parameter.actions.isValid in throw mode) rather than no hint at all.
	const detail = canonicalValidatorMessage(parameter, value);
	return detail ? ` ${detail}` : ` ${howtoForParameterType(def)}`;
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
		// ShapeDiver's isValid does not range-check the index against
		// choices.length, so enforce it here. Without this, an out-of-range
		// index (e.g. 12 for a 4-choice list) is accepted and applied.
		const choices = parameter.definition.choices ?? [];
		const index = Number(storeValue);
		if (
			choices.length > 0 &&
			(!Number.isInteger(index) || index < 0 || index >= choices.length)
		) {
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
