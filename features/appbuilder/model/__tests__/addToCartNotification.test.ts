import {
	addToCartErrorMessage,
	addToCartSuccessMessage,
	resolveThrownAddToCartError,
	toAddToCartApiFailure,
	toAddToCartApiSuccess,
} from "@AppBuilderLib/features/appbuilder/model/addToCartNotification";

const genericSuccess =
	"An item for configuration ID ms-1 has been added to the cart (cart item id cart-1).";
const genericError =
	"An error happened while adding configuration ID ms-1 to the cart.";

describe("addToCartSuccessMessage", () => {
	it("uses the reply success message instead of the action message", () => {
		expect(
			addToCartSuccessMessage({
				replySuccessMessage: "Added {modelStateId}",
				actionSuccessMessage: "Action {modelStateId}",
				modelStateId: "ms-1",
				cartItemId: "cart-1",
			}),
		).toBe("Added ms-1");
	});

	it("substitutes the model state id in the action message", () => {
		expect(
			addToCartSuccessMessage({
				actionSuccessMessage: "Saved {modelStateId}",
				modelStateId: "ms-1",
				cartItemId: "cart-1",
			}),
		).toBe("Saved ms-1");
	});

	it("lets an empty reply message fall through to the action message", () => {
		expect(
			addToCartSuccessMessage({
				replySuccessMessage: "",
				actionSuccessMessage: "Action {modelStateId}",
				modelStateId: "ms-1",
				cartItemId: "cart-1",
			}),
		).toBe("Action ms-1");
	});

	it("uses the generic sentence when the reply only has an id", () => {
		expect(
			addToCartSuccessMessage({
				modelStateId: "ms-1",
				cartItemId: "cart-1",
			}),
		).toBe(genericSuccess);
	});
});

describe("addToCartErrorMessage", () => {
	it("uses a thrown Error message instead of the action message", () => {
		expect(
			addToCartErrorMessage({
				error: new Error("Cart failed {modelStateId}"),
				actionErrorMessage: "Action {modelStateId}",
				modelStateId: "ms-1",
			}),
		).toBe("Cart failed ms-1");
	});

	it("lets an empty Error message fall through to the action message", () => {
		expect(
			addToCartErrorMessage({
				error: new Error(""),
				actionErrorMessage: "Could not add {modelStateId}",
				modelStateId: "ms-1",
			}),
		).toBe("Could not add ms-1");
	});

	it("uses the action or generic message for a non-Error rejection", () => {
		expect(
			addToCartErrorMessage({
				error: {id: "DUMMY_ID"},
				actionErrorMessage: "Could not add {modelStateId}",
				modelStateId: "ms-1",
			}),
		).toBe("Could not add ms-1");
		expect(
			addToCartErrorMessage({
				error: {id: "DUMMY_ID"},
				modelStateId: "ms-1",
			}),
		).toBe(genericError);
	});
});

describe("add-to-cart API result", () => {
	it("returns both ids on success", () => {
		expect(
			toAddToCartApiSuccess({
				modelStateId: "ms-1",
				cartItemId: "cart-1",
			}),
		).toEqual({
			success: true,
			props: {
				modelStateId: "ms-1",
				cartItemId: "cart-1",
			},
		});
	});

	it("fails when an id is missing", () => {
		expect(toAddToCartApiSuccess({})).toEqual({
			success: false,
			message: "Failed to create model state.",
		});
		expect(toAddToCartApiSuccess({modelStateId: "ms-1"})).toEqual({
			success: false,
			message: "Failed to add the item to the cart.",
		});
	});

	it("uses a thrown Error message", () => {
		expect(toAddToCartApiFailure(new Error("Cart failed ms-1"))).toEqual({
			success: false,
			message: "Cart failed ms-1",
		});
	});

	it("stringifies a non-Error rejection", () => {
		expect(toAddToCartApiFailure({id: "DUMMY_ID"})).toEqual({
			success: false,
			message: "[object Object]",
		});
	});
});

describe("resolveThrownAddToCartError", () => {
	it("substitutes the model state id and keeps the original cause", () => {
		const original = new Error("Failed {modelStateId}");
		const resolved = resolveThrownAddToCartError(original, "ms-1");
		expect(resolved).toBeInstanceOf(Error);
		expect((resolved as Error).message).toBe("Failed ms-1");
		expect((resolved as Error).cause).toBe(original);
	});

	it("leaves a rejection unchanged when the model state id is missing", () => {
		const original = new Error("Failed {modelStateId}");
		expect(resolveThrownAddToCartError(original, undefined)).toBe(original);
		expect(resolveThrownAddToCartError({id: "DUMMY_ID"}, "ms-1")).toEqual({
			id: "DUMMY_ID",
		});
	});
});
