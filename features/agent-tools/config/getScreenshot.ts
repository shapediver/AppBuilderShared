import {z} from "@AppBuilderLib/shared/lib/zod";

export const getScreenshotContentTypeSchema = z.enum([
	"image/png",
	"image/jpeg",
]);

export const getScreenshotInputSchema = z.strictObject({
	contentType: getScreenshotContentTypeSchema.optional(),
	quality: z.number().min(0).max(1).optional(),
	resolution: z
		.strictObject({
			width: z.number().int().positive().max(8192),
			height: z.number().int().positive().max(8192),
		})
		.optional(),
});

export type GetScreenshotInput = z.infer<typeof getScreenshotInputSchema>;
export type GetScreenshotOutput = {
	success: boolean;
	image_url?: string;
	message?: string;
};
