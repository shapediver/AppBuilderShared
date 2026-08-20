import {z} from "zod";

export const vec3Schema = z.strictObject({
	x: z.number(),
	y: z.number(),
	z: z.number(),
});

export const setCameraPositionInputSchema = z.strictObject({
	position: vec3Schema,
	target: vec3Schema,
	viewportId: z.string().optional(),
});

export type Vec3 = z.infer<typeof vec3Schema>;
export type SetCameraPositionInput = z.infer<
	typeof setCameraPositionInputSchema
>;
export type SetCameraPositionOutput = {
	success: boolean;
	message?: string;
};
