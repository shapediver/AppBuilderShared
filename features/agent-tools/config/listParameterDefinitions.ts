import {nameMessageSchema} from "@AppBuilderLib/features/model-state/config/importModelState.zod";
import {z} from "@AppBuilderLib/shared/lib/zod";

const colorValueSchema = z.object({
	red: z.number(),
	green: z.number(),
	blue: z.number(),
	alpha: z.number(),
});

export const parameterValueSchema = z.union([
	z.string(),
	z.number(),
	z.boolean(),
	colorValueSchema,
]);

const ListParameterDefinitionItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	displayname: z.string().optional(),
	type: z.string(),
	group: z.string().optional(),
	tooltip: z.string().optional(),
	min: z.number().nullable().optional(),
	max: z.number().nullable().optional(),
	decimalplaces: z.number().nullable().optional(),
	choices: z.array(z.string()).optional(),
	currentValue: parameterValueSchema.optional(),
	defaultValue: parameterValueSchema.optional(),
	hidden: z.boolean().optional(),
	settable: z.boolean(),
});

export const listParameterDefinitionsInputSchema = z.strictObject({});

export const listParameterDefinitionsOutputSchema = z.object({
	parameters: z.array(ListParameterDefinitionItemSchema),
	errors: z.array(nameMessageSchema).optional(),
});

export type ListParameterDefinitionItem = z.infer<
	typeof ListParameterDefinitionItemSchema
>;

/** Supported types of parameters (for now). */
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
];
