import type {IUpdateSharingLinkReply} from "@AppBuilderLib/features/ecommerce/config/ecommerceapi";
import {resolveModelStateMessage} from "@AppBuilderLib/features/model-state/lib/resolveModelStateMessage";

/**
 * Thrown after a sharing-link reply has already been shown as an error toast.
 * Callers rethrow it without a second notification.
 */
export class UpdateSharingLinkReplyError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UpdateSharingLinkReplyError";
	}
}

export function isUpdateSharingLinkReplyError(
	error: unknown,
): error is UpdateSharingLinkReplyError {
	return error instanceof UpdateSharingLinkReplyError;
}

function nonEmptyString(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

type ClassifiedUpdateSharingLinkReply =
	| {type: "error"; message: string}
	| {type: "success"; message: string}
	| {type: "href"; href: string}
	| {type: "invalid"};

/**
 * Precedence: non-empty errorMessage, then successMessage, then href.
 * Empty strings and non-strings fall through.
 */
export function classifyUpdateSharingLinkReply(
	reply: IUpdateSharingLinkReply | null | undefined,
): ClassifiedUpdateSharingLinkReply {
	const errorMessage = nonEmptyString(reply?.errorMessage);
	if (errorMessage) return {type: "error", message: errorMessage};
	const successMessage = nonEmptyString(reply?.successMessage);
	if (successMessage) return {type: "success", message: successMessage};
	const href = nonEmptyString(reply?.href);
	if (href) return {type: "href", href};
	return {type: "invalid"};
}

export type ResolvedUpdateSharingLinkReply =
	| {status: "success"; kind: "message"; message: string}
	| {status: "success"; kind: "href"; href: string}
	| {status: "error"; message: string};

/**
 * Resolve a sharing-link reply into one notification.
 * A handler success or error message replaces the action message.
 * A href reply uses the action success message when one is set.
 * An empty reply uses the action error message, or `genericErrorMessage`.
 */
export function resolveUpdateSharingLinkReply(args: {
	reply: IUpdateSharingLinkReply | null | undefined;
	modelStateId?: string;
	actionSuccessMessage?: string;
	actionErrorMessage?: string;
	genericErrorMessage: string;
}): ResolvedUpdateSharingLinkReply {
	const classified = classifyUpdateSharingLinkReply(args.reply);
	if (classified.type === "error") {
		return {
			status: "error",
			message:
				resolveModelStateMessage(
					classified.message,
					args.modelStateId,
				) ?? classified.message,
		};
	}
	if (classified.type === "success") {
		return {
			status: "success",
			kind: "message",
			message:
				resolveModelStateMessage(
					classified.message,
					args.modelStateId,
				) ?? classified.message,
		};
	}
	if (classified.type === "href") {
		const actionMessage = resolveModelStateMessage(
			args.actionSuccessMessage,
			args.modelStateId,
		);
		if (actionMessage) {
			return {status: "success", kind: "message", message: actionMessage};
		}
		return {status: "success", kind: "href", href: classified.href};
	}
	return {
		status: "error",
		message:
			resolveModelStateMessage(
				args.actionErrorMessage,
				args.modelStateId,
			) ?? args.genericErrorMessage,
	};
}

/** URL from a href-only reply. Message replies yield undefined. */
export function hrefFromUpdateSharingLinkReply(
	reply: IUpdateSharingLinkReply | null | undefined,
): string | undefined {
	const classified = classifyUpdateSharingLinkReply(reply);
	return classified.type === "href" ? classified.href : undefined;
}
