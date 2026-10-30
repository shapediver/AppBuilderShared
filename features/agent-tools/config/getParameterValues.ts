import {nameMessageSchema} from "@AppBuilderLib/features/model-state/config/importModelState.zod";
import {z} from "@AppBuilderLib/shared/lib/zod";
import {parameterValueSchema} from "./listParameterDefinitions";

export const getParameterValuesInputSchema = z.strictObject({
	names: z.array(z.string()).optional(),
	namespace: z.string().optional(),
});

/**
 * Live state of a selection parameter. `type` and `settings.type` identify
 * the parameter type + subtype, as in the parameter definition.
 */
const selectionValuePropsSchema = z.object({
	type: z.literal("Interaction"),
	settings: z.object({type: z.literal("selection")}),
	/** Names of the nodes that can currently be selected. */
	availableNodes: z.array(z.string()),
});

/**
 * Type-specific live state, one schema per parameter type + subtype.
 * Add further types (e.g. other interaction parameters) to this union.
 */
const parameterValuePropsSchema = z.union([selectionValuePropsSchema]);

const getParameterValueItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	displayname: z.string().optional(),
	namespace: z.string(),
	currentValue: parameterValueSchema.optional(),
	props: parameterValuePropsSchema.optional(),
});

export const getParameterValuesOutputSchema = z.object({
	values: z.array(getParameterValueItemSchema),
	errors: z.array(nameMessageSchema).optional(),
});

export type ParameterValueProps = z.infer<typeof parameterValuePropsSchema>;
export type GetParameterValueItem = z.infer<typeof getParameterValueItemSchema>;
export type GetParameterValuesOutput = z.infer<
	typeof getParameterValuesOutputSchema
>;
