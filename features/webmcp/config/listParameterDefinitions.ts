import {z} from "@AppBuilderLib/shared/lib/zod";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";

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
	sessionId: z.string(),
	name: z.string(),
	displayname: z.string().optional(),
	type: z.string(),
	howto: z.string(),
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
		.describe(
			"Optional session namespace. Omit to list parameter definitions for all sessions.",
		),
});

export const listParameterDefinitionsOutputSchema = z.object({
	content: z.array(
		z.object({
			type: z.literal("text"),
			text: z.string(),
		}),
	),
	structuredContent: z
		.object({
			parameters: z.array(ListParameterDefinitionItemSchema).optional(),
			error: z.unknown().optional(),
		})
		.optional(),
	isError: z.literal(true).optional(),
});

export type ListParameterDefinitionItem = z.infer<
	typeof ListParameterDefinitionItemSchema
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
