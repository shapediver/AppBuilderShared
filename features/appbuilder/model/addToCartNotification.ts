import {resolveModelStateMessage} from "@AppBuilderLib/features/model-state/lib/resolveModelStateMessage";

export type AddToCartApiResult =
	| {success: true; modelStateId: string; cartItemId: string}
	| {success: false; message: string};

/** Success toast: reply message, then the action message, then the generic sentence. */
export function addToCartSuccessMessage(args: {
	replySuccessMessage?: string;
	actionSuccessMessage?: string;
	modelStateId?: string;
	cartItemId?: string;
}): string {
	const replyMessage = resolveModelStateMessage(
		args.replySuccessMessage,
		args.modelStateId,
	);
	if (replyMessage) return replyMessage;
	const actionMessage = resolveModelStateMessage(
		args.actionSuccessMessage,
		args.modelStateId,
	);
	if (actionMessage) return actionMessage;
	return `An item for configuration ID ${args.modelStateId} has been added to the cart (cart item id ${args.cartItemId}).`;
}

/**
 * Error toast. A thrown Error message replaces the action message.
 * Other rejections keep the action message, then the generic sentence.
 */
export function addToCartErrorMessage(args: {
	error: unknown;
	actionErrorMessage?: string;
	modelStateId?: string;
}): string {
	if (args.error instanceof Error && args.error.message.length > 0) {
		return (
			resolveModelStateMessage(args.error.message, args.modelStateId) ??
			args.error.message
		);
	}
	return (
		resolveModelStateMessage(args.actionErrorMessage, args.modelStateId) ??
		`An error happened while adding configuration ID ${args.modelStateId} to the cart.`
	);
}

export function toAddToCartApiSuccess(result: {
	modelStateId?: string;
	cartItemId?: string;
}): AddToCartApiResult {
	if (!result.modelStateId) {
		return {success: false, message: "Failed to create model state."};
	}
	if (!result.cartItemId) {
		return {success: false, message: "Failed to add the item to the cart."};
	}
	return {
		success: true,
		modelStateId: result.modelStateId,
		cartItemId: result.cartItemId,
	};
}

export function toAddToCartApiFailure(error: unknown): {
	success: false;
	message: string;
} {
	return {
		success: false,
		message: error instanceof Error ? error.message : String(error),
	};
}

/**
 * Substitute `{modelStateId}` in a thrown Error once the id exists.
 * Other rejections are returned unchanged.
 */
export function resolveThrownAddToCartError(
	error: unknown,
	modelStateId?: string,
): unknown {
	if (!(error instanceof Error) || !modelStateId) return error;
	const resolved =
		resolveModelStateMessage(error.message, modelStateId) ?? error.message;
	return new Error(resolved, {cause: error});
}
