import {
	importModelStateDataSchema,
	importModelStateInvalidParameterSchema,
} from "@AppBuilderLib/features/model-state/config/importModelState.zod";
import {z} from "zod";

export const importModelStateInputSchema = importModelStateDataSchema;

export const importModelStateSuccessOutputSchema = z.object({
	success: z.literal(true),
	appliedParameterIds: z.array(z.string()),
	invalidParameters: z
		.array(importModelStateInvalidParameterSchema)
		.optional(),
});

export const importModelStateFailureOutputSchema = z.object({
	success: z.literal(false),
	message: z.string(),
	invalidParameters: z
		.array(importModelStateInvalidParameterSchema)
		.optional(),
});

export const importModelStateOutputSchema = z.union([
	importModelStateSuccessOutputSchema,
	importModelStateFailureOutputSchema,
]);

export type ImportModelStateInput = z.infer<typeof importModelStateInputSchema>;
export type ImportModelStateOutput = z.infer<
	typeof importModelStateOutputSchema
>;
