import {nameMessageSchema} from "@AppBuilderLib/features/model-state/config/importModelState.zod";
import {z} from "@AppBuilderLib/shared/lib/zod";
import {parameterValueSchema} from "./listParameterDefinitions";

export const getParameterValuesInputSchema = z.strictObject({
	names: z.array(z.string()).optional(),
	namespace: z.string().optional(),
});

const getParameterValueItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	displayname: z.string().optional(),
	namespace: z.string(),
	currentValue: parameterValueSchema.optional(),
});

export const getParameterValuesOutputSchema = z.object({
	values: z.array(getParameterValueItemSchema),
	errors: z.array(nameMessageSchema).optional(),
});

export type GetParameterValueItem = z.infer<typeof getParameterValueItemSchema>;
export type GetParameterValuesOutput = z.infer<
	typeof getParameterValuesOutputSchema
>;
