import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {IShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/config/shapediverStoreParameters";
import {
	composeSdColor,
	type DecomposedColorFormat,
} from "@AppBuilderLib/shared/lib/colors";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {z} from "zod";
import {
	parseStringListIndex,
	toStringListStoreValue,
} from "../lib/stringListValue";
import {parameterValueSchema, SUPPORTED_PARAMETER_TYPES} from "./listParameterDefinitions";

export const setParameterValuesInputSchema = z.strictObject({
	updates: z
		.array(
			z.strictObject({
				name: z
					.string()
					.describe(
						"Parameter id, internal name, or display name from list_parameter_definitions.",
					),
				sessionId: z
					.string()
					.optional()
					.describe(
						"Optional session namespace. Omit for the main model.",
					),
				value: parameterValueSchema.describe(
					"New value. StringList: 0-based integer index (e.g. 1 for second choice), not the label text and not {index:N}.",
				),
			}),
		)
		.describe(
			"Required array of changes. Use this field name exactly — not parameters or ids.",
		),
});

export const setParameterValuesErrorSchema = z.object({
	name: z.string(),
	message: z.string(),
});

export const setParameterValuesOutputSchema = z.object({
	applied: z.array(z.string()),
	errors: z.array(setParameterValuesErrorSchema),
});

export type SetParameterValuesInput = z.infer<
	typeof setParameterValuesInputSchema
>;
export type SetParameterValuesOutput = z.infer<
	typeof setParameterValuesOutputSchema
>;
export type SetParameterValuesError = z.infer<
	typeof setParameterValuesErrorSchema
>;
export type ParameterUpdateInput = SetParameterValuesInput["updates"][number];
export type ParameterValueInput = z.infer<typeof parameterValueSchema>;

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

function findParameter(
	parameters: IShapeDiverParameter<any>[],
	name: string,
): IShapeDiverParameter<any> | undefined {
	return parameters.find(
		(p) =>
			p.definition.id === name ||
			p.definition.name === name ||
			p.definition.displayname === name,
	);
}

function getValidationErrorMessage(
	parameter: IShapeDiverParameter<any>,
	value: ParameterValueInput,
): string {
	const def = parameter.definition;
	const type = def.type;

	if (isColorObject(value) && type !== ResParameterType.COLOR) {
		return "Color object value is only valid for Color parameters.";
	}

	if (type === ResParameterType.STRINGLIST) {
		const choices = def.choices ?? [];
		const index = parseStringListIndex(value);
		if (index === undefined) {
			return `Value type does not match parameter type ${type}. Use a 0-based integer index.`;
		}

		return `Index ${index} is not valid (choices: 0..${Math.max(choices.length - 1, 0)}).`;
	}

	if (type === ResParameterType.COLOR) {
		if (!isColorObject(value)) {
			return `Value type does not match parameter type ${type}.`;
		}

		return `New color ${JSON.stringify(value)} is not valid for parameter.`;
	}

	if (
		type === ResParameterType.EVEN ||
		type === ResParameterType.ODD ||
		type === ResParameterType.INT ||
		type === ResParameterType.FLOAT
	) {
		if (typeof value !== "number") {
			return `Value type does not match parameter type ${type}.`;
		}
		const min = def.min ?? null;
		const max = def.max ?? null;

		return `Value ${value} is out of range [${min}, ${max}].`;
	}

	if (type === ResParameterType.STRING) {
		if (typeof value !== "string") {
			return `Value type does not match parameter type ${type}.`;
		}

		return `String value exceeds maximum length of ${def.max}.`;
	}

	if (type === ResParameterType.BOOL) {
		if (typeof value !== "boolean") {
			return `Value type does not match parameter type ${type}.`;
		}
	}

	return `Value ${value} is not valid for parameter.`;
}

/**
 * Pure validation and batch-update logic for set_parameter_values.
 */
export async function resolveAndUpdate(
	defaultNamespace: string,
	getParameters: (namespace: string) => IShapeDiverParameter<any>[],
	updates: ParameterUpdateInput[],
	batchUpdate: IShapeDiverStoreParameters["batchParameterValueUpdate"],
): Promise<SetParameterValuesOutput> {
	const errors: SetParameterValuesError[] = [];
	const valuesByNamespace: Record<string, Record<string, unknown>> = {};
	const processedIds = new Set<string>();

	for (const update of updates) {
		const targetNamespace = update.sessionId ?? defaultNamespace;
		const parameters = getParameters(targetNamespace);
		const parameter = findParameter(parameters, update.name);
		if (!parameter) {
			errors.push({
				name: update.name,
				message: `Parameter with id/name/displayname "${update.name}" does not exist.`,
			});
			continue;
		}

		const paramId = parameter.definition.id;
		if (processedIds.has(paramId)) {
			errors.push({
				name: update.name,
				message: `Refusing to update parameter "${update.name}" twice.`,
			});
			continue;
		}
		processedIds.add(paramId);

		const def = parameter.definition;
		const {value} = update;

		if (!SUPPORTED_PARAMETER_TYPES.includes(def.type)) {
			errors.push({
				name: update.name,
				message: `Parameter type "${def.type}" is not supported for setting via WebMCP.`,
			});
			continue;
		}

		if (isColorObject(value) && def.type !== ResParameterType.COLOR) {
			errors.push({
				name: update.name,
				message:
					"Color object value is only valid for Color parameters.",
			});
			continue;
		}

		let preparedValue: unknown;
		if (def.type === ResParameterType.COLOR) {
			if (!isColorObject(value)) {
				errors.push({
					name: update.name,
					message: `Value type does not match parameter type ${def.type}.`,
				});
				continue;
			}
			preparedValue = composeSdColor(value);
			if (!parameter.actions.isValid(preparedValue, false)) {
				errors.push({
					name: update.name,
					message: getValidationErrorMessage(parameter, value),
				});
				continue;
			}
		} else if (def.type === ResParameterType.STRINGLIST) {
			const storeValue = toStringListStoreValue(value);
			if (storeValue === undefined) {
				errors.push({
					name: update.name,
					message: `Value type does not match parameter type ${def.type}. Use a 0-based integer index.`,
				});
				continue;
			}
			if (!parameter.actions.isValid(storeValue, false)) {
				errors.push({
					name: update.name,
					message: getValidationErrorMessage(parameter, value),
				});
				continue;
			}
			preparedValue = storeValue;
		} else {
			if (isColorObject(value)) {
				errors.push({
					name: update.name,
					message:
						"Color object value is only valid for Color parameters.",
				});
				continue;
			}
			if (!parameter.actions.isValid(value, false)) {
				errors.push({
					name: update.name,
					message: getValidationErrorMessage(parameter, value),
				});
				continue;
			}
			preparedValue = value;
		}

		if (!valuesByNamespace[targetNamespace]) {
			valuesByNamespace[targetNamespace] = {};
		}
		valuesByNamespace[targetNamespace][paramId] = preparedValue;
	}

	const applied = Object.values(valuesByNamespace).flatMap((values) =>
		Object.keys(values),
	);

	if (applied.length > 0) {
		await batchUpdate(valuesByNamespace);
	}

	return {applied, errors};
}
