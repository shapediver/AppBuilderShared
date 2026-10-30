import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {selectionValueSchema} from "@AppBuilderLib/features/agent-tools/config/listParameterDefinitions";
import type {DecomposedColorFormat} from "@AppBuilderLib/shared/lib/colors";
import {composeSdColor} from "@AppBuilderLib/shared/lib/colors";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	type AgentSelectionSettings,
	getSelectionSettings,
	parseSelectionValue,
} from "../selectionParameter";
import {parseStringListIndex, toStringListStoreValue} from "../stringListValue";
import type {
	ParameterValueInput,
	ParameterValuePrepareContext,
	ParameterValuePrepareResult,
} from "./types";

const COLOR_ON_NON_COLOR_MESSAGE =
	"Color object value is only valid for Color parameters.";

const SELECTION_ON_NON_SELECTION_MESSAGE =
	"Selection value {names} is only valid for selection parameters.";

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
	const selection = getSelectionSettings(def);
	if (selection) {
		return ` ${selectionHint(selection.minimumSelection, selection.maximumSelection)}`;
	}
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

function selectionHint(min: number, max: number): string {
	const count = min === max ? `${min}` : `${min} to ${max}`;
	return `Use {names: [...]} with ${count} unique node names from props.availableNodes of get_parameter_values.`;
}

/**
 * Validate the node names for a selection parameter and serialize them
 * the way the selection UI does (`{"names": [...]}`). Accepts the
 * `{names}` object or its JSON string.
 * Respects minimumSelection/maximumSelection and the nameFilter: only names
 * of nodes that currently match the nameFilter can be selected.
 */
function prepareSelectionStoreValue(
	parameter: IShapeDiverParameter<any>,
	selection: AgentSelectionSettings,
	value: ParameterValueInput,
	context: ParameterValuePrepareContext,
): ParameterValuePrepareResult {
	const {minimumSelection: min, maximumSelection: max} = selection;
	const names = parseSelectionValue(value);
	if (!names) {
		return {success: false, message: invalidValueMessage(parameter, value)};
	}

	const name = parameter.definition.displayname || parameter.definition.name;
	if (new Set(names).size !== names.length) {
		return {
			success: false,
			message: `Value ${JSON.stringify(value)} for parameter "${name}" contains duplicate node names. ${selectionHint(min, max)}`,
		};
	}
	if (names.length < min || names.length > max) {
		return {
			success: false,
			message: `Parameter "${name}" requires ${min === max ? min : `${min} to ${max}`} selected node names, got ${names.length}. ${selectionHint(min, max)}`,
		};
	}

	if (names.length > 0 && context.getAvailableNodes) {
		const selectable = context.getAvailableNodes(selection.nameFilter);
		const unknown = names.filter((n) => !selectable.includes(n));
		if (unknown.length > 0) {
			return {
				success: false,
				message: `Node names ${JSON.stringify(unknown)} are not selectable for parameter "${name}". Available nodes: ${JSON.stringify(selectable)}.`,
			};
		}
	}

	return {success: true, storeValue: JSON.stringify({names})};
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
 * live here. Selection parameters are validated here (count, nameFilter),
 * because the viewer validator only checks for a string.
 */
export function prepareParameterStoreValue(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
	context: ParameterValuePrepareContext = {},
): ParameterValuePrepareResult {
	const type = parameter.definition.type;
	const selection = getSelectionSettings(parameter.definition);

	if (isColorObject(value) && type !== ResParameterType.COLOR) {
		return {success: false, message: COLOR_ON_NON_COLOR_MESSAGE};
	}
	if (selectionValueSchema.safeParse(value).success && !selection) {
		return {success: false, message: SELECTION_ON_NON_SELECTION_MESSAGE};
	}

	let storeValue: unknown;
	if (selection) {
		const prepared = prepareSelectionStoreValue(
			parameter,
			selection,
			value,
			context,
		);
		if (!prepared.success) return prepared;
		storeValue = prepared.storeValue;
	} else if (type === ResParameterType.COLOR) {
		if (!isColorObject(value)) {
			return {
				success: false,
				message: invalidValueMessage(parameter, value),
			};
		}
		storeValue = composeSdColor(value);
	} else if (type === ResParameterType.STRINGLIST) {
		storeValue = toStringListStoreValue(value);
		if (storeValue === undefined) {
			return {
				success: false,
				message: invalidValueMessage(parameter, value),
			};
		}
		const index = parseStringListIndex(storeValue);
		const choiceCount = parameter.definition.choices?.length ?? 0;
		if (index === undefined || index < 0 || index >= choiceCount) {
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
