import {nameMessageSchema} from "@AppBuilderLib/features/model-state/config/importModelState.zod";
import {z} from "@AppBuilderLib/shared/lib/zod";

const colorValueSchema = z.object({
	red: z.number(),
	green: z.number(),
	blue: z.number(),
	alpha: z.number(),
});

/** Value of a selection parameter (`SelectionParameterValue`): names of the selected nodes. */
export const selectionValueSchema = z.object({
	names: z.array(z.string()),
});

export const parameterValueSchema = z.union([
	z.string(),
	z.number(),
	z.boolean(),
	colorValueSchema,
	selectionValueSchema,
]);

/**
 * Settings of a selection parameter: the subset of the definition's
 * settings (`{type, props}`) relevant to the agent, with the defaults of
 * the selection UI applied.
 */
const selectionSettingsSchema = z.object({
	type: z.literal("selection"),
	props: z.object({
		minimumSelection: z.number(),
		maximumSelection: z.number(),
	}),
});

/**
 * Agent-relevant subset of a parameter definition's settings, in the same
 * format as the definition. One schema per parameter type + subtype.
 */
const parameterSettingsSchema = z.union([selectionSettingsSchema]);

const ListParameterDefinitionItemSchema = z.object({
	id: z.string(),
	namespace: z.string(),
	name: z.string(),
	displayname: z.string().optional(),
	type: z.string(),
	group: z.string().optional(),
	tooltip: z.string().optional(),
	min: z.number().nullable().optional(),
	max: z.number().nullable().optional(),
	decimalplaces: z.number().nullable().optional(),
	choices: z.array(z.string()).optional(),
	settings: parameterSettingsSchema.optional(),
	currentValue: parameterValueSchema.optional(),
	defaultValue: parameterValueSchema.optional(),
	hidden: z.boolean().optional(),
	settable: z.boolean(),
	description: z.string().optional(),
});

export const listParameterDefinitionsInputSchema = z.strictObject({});

export const listParameterDefinitionsOutputSchema = z.object({
	parameters: z.array(ListParameterDefinitionItemSchema),
	errors: z.array(nameMessageSchema).optional(),
});

export type ListParameterDefinitionItem = z.infer<
	typeof ListParameterDefinitionItemSchema
>;

/** Type key of selection parameters, see `parameterTypeKey`. */
export const SELECTION_PARAMETER_TYPE_KEY = "Interaction.selection";

/**
 * Supported types of parameters (for now), keyed by type and subtype,
 * see `parameterTypeKey`.
 */
// TODO SS-9745: Grasshopper-dev-controlled exposure for additional parameter types.
export const SUPPORTED_PARAMETER_TYPES: string[] = [
	"Bool",
	"Color",
	"Even",
	"Float",
	"Int",
	"Odd",
	"String",
	"StringList",
	SELECTION_PARAMETER_TYPE_KEY,
];
