import {z} from "zod";

export const importModelStateInputSchema = z.strictObject({
	modelStateId: z
		.string()
		.describe(
			"modelStateId from create_model_state, or a full model view URL containing modelStateId.",
		),
});

export const importModelStateInvalidParameterSchema = z.object({
	name: z.string(),
	message: z.string(),
});

export const importModelStateSuccessOutputSchema = z.object({
	success: z.literal(true),
	appliedParameterIds: z.array(z.string()),
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
