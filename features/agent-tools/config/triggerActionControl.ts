import {z} from "@AppBuilderLib/shared/lib/zod";

export const triggerActionControlInputSchema = z.strictObject({
	name: z.string(),
});

export type RunActionControlResult = {success: boolean; message?: string};
