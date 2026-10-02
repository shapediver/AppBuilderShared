import type {ActiveCamera} from "@AppBuilderLib/entities/viewport/lib/readActiveCamera";
import {z} from "@AppBuilderLib/shared/lib/zod";

export const getCameraInputSchema = z.strictObject({});

export type GetCameraInput = z.infer<typeof getCameraInputSchema>;
export type GetCameraOutput = {
	success: boolean;
	camera?: ActiveCamera;
	message?: string;
};
