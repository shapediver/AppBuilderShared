import {
	classifyUpdateSharingLinkReply,
	hrefFromUpdateSharingLinkReply,
	isUpdateSharingLinkReplyError,
	resolveUpdateSharingLinkReply,
	UpdateSharingLinkReplyError,
} from "@AppBuilderLib/features/ecommerce/lib/interpretUpdateSharingLinkReply";

const genericErrorMessage = "An error happened while saving the model state.";

describe("resolveUpdateSharingLinkReply", () => {
	it("uses the href when that is the only field", () => {
		expect(
			resolveUpdateSharingLinkReply({
				reply: {href: "https://example.com/s"},
				modelStateId: "ms-1",
				genericErrorMessage,
			}),
		).toEqual({
			status: "success",
			kind: "href",
			href: "https://example.com/s",
		});
	});

	it("uses the action success message for a href reply", () => {
		expect(
			resolveUpdateSharingLinkReply({
				reply: {href: "https://example.com/s"},
				modelStateId: "ms-1",
				actionSuccessMessage: "Saved {modelStateId}",
				genericErrorMessage,
			}),
		).toEqual({
			status: "success",
			kind: "message",
			message: "Saved ms-1",
		});
	});

	it("replaces the action success message with the handler success message", () => {
		expect(
			resolveUpdateSharingLinkReply({
				reply: {
					successMessage: "Handler {modelStateId}",
					href: "https://example.com/s",
				},
				modelStateId: "ms-1",
				actionSuccessMessage: "Action {modelStateId}",
				genericErrorMessage,
			}),
		).toEqual({
			status: "success",
			kind: "message",
			message: "Handler ms-1",
		});
	});

	it("fails once with the handler error message", () => {
		const resolved = resolveUpdateSharingLinkReply({
			reply: {
				errorMessage: "Failed {modelStateId}",
				successMessage: "ok",
				href: "https://example.com/s",
			},
			modelStateId: "ms-1",
			actionErrorMessage: "Action error {modelStateId}",
			genericErrorMessage,
		});
		expect(resolved).toEqual({status: "error", message: "Failed ms-1"});
		if (resolved.status !== "error") {
			throw new Error("expected an error outcome");
		}
		const error = new UpdateSharingLinkReplyError(resolved.message);
		const toasts: string[] = [];
		toasts.push(resolved.message);
		if (!isUpdateSharingLinkReplyError(error)) {
			toasts.push(genericErrorMessage);
		}
		expect(toasts).toEqual(["Failed ms-1"]);
	});

	it("treats an empty reply as the action error", () => {
		expect(
			resolveUpdateSharingLinkReply({
				reply: {},
				modelStateId: "ms-1",
				actionErrorMessage: "Could not save {modelStateId}",
				genericErrorMessage,
			}),
		).toEqual({status: "error", message: "Could not save ms-1"});
	});

	it("uses the generic error when an empty reply has no action message", () => {
		expect(
			resolveUpdateSharingLinkReply({
				reply: {},
				genericErrorMessage,
			}),
		).toEqual({status: "error", message: genericErrorMessage});
	});

	it("lets an empty string fall through to the next field", () => {
		expect(
			classifyUpdateSharingLinkReply({
				errorMessage: "",
				successMessage: "",
				href: "https://example.com/s",
			}),
		).toEqual({type: "href", href: "https://example.com/s"});
	});
});

describe("hrefFromUpdateSharingLinkReply", () => {
	it("returns a href only when no message is present", () => {
		expect(hrefFromUpdateSharingLinkReply({href: "https://a"})).toBe(
			"https://a",
		);
		expect(
			hrefFromUpdateSharingLinkReply({
				href: "https://a",
				successMessage: "saved",
			}),
		).toBeUndefined();
	});
});
