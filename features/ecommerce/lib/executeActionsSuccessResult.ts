import type {ITriggerActionReply} from "@AppBuilderLib/features/ecommerce/config/ecommerceapi";

/** Successful executeActions reply. Nested replies stay in action order. */
export function executeActionsSuccessResult(
	results: readonly ITriggerActionReply[],
): ITriggerActionReply<"executeActions"> {
	return {success: true, props: {results: [...results]}};
}
