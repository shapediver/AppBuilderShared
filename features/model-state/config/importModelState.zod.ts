import {z} from "zod";

/** Shared `{ name, message }` for validation / tool errors. */
export const nameMessageSchema = z.object({
	name: z.string(),
	message: z.string(),
});

export const importModelStateDataSchema = z.strictObject({
	modelStateId: z
		.string()
		.describe(
			"modelStateId from a createModelState action, or a full model view URL containing modelStateId.",
		),
});
