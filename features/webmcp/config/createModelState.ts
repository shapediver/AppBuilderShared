import {createModelStateDataSchema} from "@AppBuilderLib/features/model-state/config/createModelState.zod";
import {z} from "zod";

/** WebMCP input = hook data without `image` (agents don't set export screenshot refs). */
export const createModelStateInputSchema = createModelStateDataSchema.omit({
	image: true,
});

export const createModelStateSuccessOutputSchema = z.object({
	success: z.literal(true),
	modelStateId: z.string(),
	modelStateImageUrl: z.string().optional(),
	modelStateGltfUrl: z.string().optional(),
	modelStateUsdzUrl: z.string().optional(),
	modelViewUrl: z.string(),
});

export const createModelStateFailureOutputSchema = z.object({
	success: z.literal(false),
	error: z.string(),
});

export const createModelStateOutputSchema = z.union([
	createModelStateSuccessOutputSchema,
	createModelStateFailureOutputSchema,
]);

export type CreateModelStateInput = z.infer<typeof createModelStateInputSchema>;
export type CreateModelStateOutput = z.infer<
	typeof createModelStateOutputSchema
>;
