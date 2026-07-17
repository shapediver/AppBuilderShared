import {nameMessageSchema} from "@AppBuilderLib/features/model-state/config/importModelState.zod";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {z} from "zod";

export const colorValueSchema = z.object({
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

export const ListParameterDefinitionItemSchema = z.object({
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

export const listParameterDefinitionsInputSchema = z.strictObject({
	filter: z
		.enum(["all", "visible"])
		.optional()
		.describe(
			"all = every parameter; visible = parameters not hidden by the model (definition.hidden === false). Defaults to all.",
		),
	sessionId: z
		.string()
		.optional()
		.describe("Optional session namespace. Omit for the main model."),
});

export const listParameterDefinitionsErrorSchema = nameMessageSchema;

export const listParameterDefinitionsOutputSchema = z.object({
	parameters: z.array(ListParameterDefinitionItemSchema),
	errors: z.array(listParameterDefinitionsErrorSchema).optional(),
});

export type ListParameterDefinitionItem = z.infer<
	typeof ListParameterDefinitionItemSchema
>;
export type ListParameterDefinitionsInput = z.infer<
	typeof listParameterDefinitionsInputSchema
>;
export type ListParameterDefinitionsOutput = z.infer<
	typeof listParameterDefinitionsOutputSchema
>;
export type ListParameterDefinitionsError = z.infer<
	typeof listParameterDefinitionsErrorSchema
>;

/** Supported types of parameters (for now). */
// TODO SS-9745: Grasshopper-dev-controlled exposure for additional parameter types.
export const SUPPORTED_PARAMETER_TYPES: ResParameterType[] = [
	ResParameterType.BOOL,
	ResParameterType.COLOR,
	ResParameterType.EVEN,
	ResParameterType.FLOAT,
	ResParameterType.INT,
	ResParameterType.ODD,
	ResParameterType.STRING,
	ResParameterType.STRINGLIST,
];
