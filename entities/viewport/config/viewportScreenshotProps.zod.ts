import {z} from "@AppBuilderLib/shared/lib/zod";
import {CAMERA_TYPE} from "@shapediver/viewer.shared.types";

/**
 * Canonical Zod schema for viewport screenshot options
 * (`getScreenshot` / `getScreenshotAdvanced` props).
 * Used by App Builder parameter value sources and create-model-state actions.
 */
export const viewportScreenshotPropsSchema = z.strictObject({
	contentType: z.string().optional(),
	quality: z.number().min(0).max(1).optional(),
	resolution: z
		.strictObject({
			width: z.number().int().positive(),
			height: z.number().int().positive(),
		})
		.optional(),
	// name lookup or camera type; other camera fields allowed via looseObject
	camera: z
		.union([
			z.looseObject({
				name: z.string(),
			}),
			z.looseObject({
				type: z.enum(CAMERA_TYPE),
			}),
		])
		.optional(),
});
