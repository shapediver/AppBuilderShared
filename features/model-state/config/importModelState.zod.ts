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
			"modelStateId from create_model_state, or a full model view URL containing modelStateId.",
		),
});

export const importModelStateInvalidParameterSchema = nameMessageSchema;
