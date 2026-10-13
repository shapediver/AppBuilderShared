import type {ITriggerActionReply} from "@AppBuilderLib/features/ecommerce/config/ecommerceapi";
import {z} from "@AppBuilderLib/shared/lib/zod";

export const triggerActionControlInputSchema = z.strictObject({
	name: z.string(),
});

/** Tools action result. The action type is chosen at runtime, so `props` is the open union. */
export type RunActionControlResult = ITriggerActionReply;
