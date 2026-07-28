import type {IShapeDiverParameterDefinition} from "@AppBuilderLib/entities/parameter/config/parameter";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";

const NUMERIC_TYPES: ResParameterType[] = [
	ResParameterType.INT,
	ResParameterType.FLOAT,
	ResParameterType.EVEN,
	ResParameterType.ODD,
];

const INTEGER_TYPES: ResParameterType[] = [
	ResParameterType.INT,
	ResParameterType.EVEN,
	ResParameterType.ODD,
];

/**
 * Type-specific instruction for agents (list_parameter_definitions `howto`
 * and set_parameter_values invalid-value hints). Wording must stay aligned
 * with prepareParameterStoreValue error messages.
 *
 * Guards (never send ...) are part of the hint so weak models do not
 * fall back to label text, hex strings, {index:N} wrappers, etc.
 */
export function howtoForParameterType(
	def: IShapeDiverParameterDefinition,
): string {
	const type = def.type as ResParameterType;
	if (type === ResParameterType.STRINGLIST) {
		const choices = def.choices ?? [];
		return `Use a 0-based integer index (0..${Math.max(choices.length - 1, 0)}). Choices: ${JSON.stringify(choices)}. Never send the label text. Never wrap in {index:N}.`;
	}
	if (INTEGER_TYPES.includes(type)) {
		const min = def.min ?? Number.NEGATIVE_INFINITY;
		const max = def.max ?? Number.POSITIVE_INFINITY;
		const parity =
			type === ResParameterType.EVEN
				? "even "
				: type === ResParameterType.ODD
					? "odd "
					: "";
		const article = parity ? "a" : "an";
		return `Use ${article} ${parity}integer in range [${min}, ${max}].`;
	}
	if (type === ResParameterType.FLOAT) {
		const min = def.min ?? Number.NEGATIVE_INFINITY;
		const max = def.max ?? Number.POSITIVE_INFINITY;
		return `Use a number in range [${min}, ${max}].`;
	}
	if (type === ResParameterType.COLOR) {
		return "Use a color object {red, green, blue, alpha} (0-255). Never send a hex string or color name.";
	}
	if (type === ResParameterType.BOOL) {
		return 'Use a boolean. Never send 0/1 or "true"/"false" strings.';
	}
	if (type === ResParameterType.STRING) {
		return def.max !== undefined
			? `Use a string of length <= ${def.max}. Never send an index or object.`
			: "Use a string. Never send an index or object.";
	}
	return "Use a value valid for this parameter type.";
}

export function isHowtoTypeKnown(type: string): boolean {
	const t = type as ResParameterType;
	return (
		t === ResParameterType.STRINGLIST ||
		NUMERIC_TYPES.includes(t) ||
		t === ResParameterType.COLOR ||
		t === ResParameterType.BOOL ||
		t === ResParameterType.STRING
	);
}
