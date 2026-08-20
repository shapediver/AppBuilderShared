import {z} from "@AppBuilderLib/shared/lib/zod";

export const getScreenshotInputSchema = z.strictObject({
	viewportId: z.string().optional(),
});

export type GetScreenshotInput = z.infer<typeof getScreenshotInputSchema>;
export type GetScreenshotOutput = {
	success: boolean;
	image?: string;
	message?: string;
};
