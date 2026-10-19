import {activeCameraSchema} from "@AppBuilderLib/entities/viewport/lib/readActiveCamera";
import {z} from "@AppBuilderLib/shared/lib/zod";

export const setCameraInputSchema = activeCameraSchema.partial();

export type SetCameraInput = z.infer<typeof setCameraInputSchema>;
export type SetCameraOutput = {
	success: boolean;
	message?: string;
};
