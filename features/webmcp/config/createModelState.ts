import {createModelStateDataSchema} from "@AppBuilderLib/features/model-state/config/createModelState.zod";
import {z} from "zod";

/** WebMCP input = hook data without `image` (agents don't set export screenshot refs). */
export const createModelStateInputSchema = createModelStateDataSchema
	.omit({image: true})
	.extend({
		parameterNamesToInclude: z
			.array(z.string())
			.optional()
			.describe("Only include these parameters in the saved state."),
		parameterNamesToExclude: z
			.array(z.string())
			.optional()
			.describe("Exclude these parameters from the saved state."),
		includeImage: z
			.boolean()
			.optional()
			.describe(
				"Whether to include a preview image. Use false when not needed.",
			),
		includeGltf: z
			.boolean()
			.optional()
			.describe("Whether to include an exported GLTF asset."),
		data: z
			.record(z.string(), z.any())
			.optional()
			.describe("Optional custom metadata to store with the state."),
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
