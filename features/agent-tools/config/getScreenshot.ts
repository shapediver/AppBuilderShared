import {z} from "@AppBuilderLib/shared/lib/zod";

export const getScreenshotInputSchema = z.strictObject({});

export type GetScreenshotInput = z.infer<typeof getScreenshotInputSchema>;
export type GetScreenshotOutput = {
	success: boolean;
	image?: string;
	message?: string;
};
