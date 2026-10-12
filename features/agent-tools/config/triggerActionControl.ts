import {z} from "@AppBuilderLib/shared/lib/zod";

export const triggerActionControlInputSchema = z.strictObject({
	name: z.string(),
});

export type RunActionControlResult = {
	success: boolean;
	message?: string;
	/** Present when an addToCart action succeeds. */
	modelStateId?: string;
	/** Present when an addToCart action succeeds. */
	cartItemId?: string;
};
