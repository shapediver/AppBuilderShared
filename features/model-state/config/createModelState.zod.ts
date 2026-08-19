import {viewportScreenshotPropsSchema} from "@AppBuilderLib/entities/viewport/config/viewportScreenshotProps.zod";
import {z} from "@AppBuilderLib/shared/lib/zod";

export const createModelStateImageRefSchema = z.strictObject({
	export: z
		.strictObject({
			name: z.string(),
			sessionId: z.string().optional(),
		})
		.optional(),
	href: z.string().optional(),
});

export const createModelStateCoreSchema = z.strictObject({
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
	screenshotProps: viewportScreenshotPropsSchema
		.optional()
		.describe(
			"Screenshot settings applied when capturing the preview image automatically.",
		),
});

export const createModelStateDataSchema = createModelStateCoreSchema.extend({
	image: createModelStateImageRefSchema.optional(),
	data: z
		.record(z.string(), z.any())
		.optional()
		.describe("Optional custom metadata to store with the state."),
});
