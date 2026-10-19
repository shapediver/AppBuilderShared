jest.mock("@shapediver/viewer.shared.types", () => ({
	CAMERA_TYPE: {
		PERSPECTIVE: "perspective",
		ORTHOGRAPHIC: "orthographic",
	},
}));

import {
	IAppBuilderActionPropsAddToCartSchema,
	IAppBuilderActionPropsCreateModelStateSchema,
} from "@AppBuilderLib/features/appbuilder/config/appbuilderActionsTypecheck";

describe("createModelState and addToCart properties", () => {
	it("accepts properties on createModelState, including an empty object", () => {
		expect(
			IAppBuilderActionPropsCreateModelStateSchema.safeParse({}).success,
		).toBe(true);
		expect(
			IAppBuilderActionPropsCreateModelStateSchema.safeParse({
				properties: {},
			}).success,
		).toBe(true);
		expect(
			IAppBuilderActionPropsCreateModelStateSchema.safeParse({
				properties: {color: "red"},
			}).success,
		).toBe(true);
	});

	it("rejects non-string property values", () => {
		expect(
			IAppBuilderActionPropsCreateModelStateSchema.safeParse({
				properties: {color: 1},
			}).success,
		).toBe(false);
	});

	it("accepts properties on addToCart", () => {
		expect(
			IAppBuilderActionPropsAddToCartSchema.safeParse({
				productId: "p",
				properties: {sku: "abc"},
			}).success,
		).toBe(true);
	});

	it("does not accept updateUrl on the createModelState action", () => {
		expect(
			IAppBuilderActionPropsCreateModelStateSchema.safeParse({
				updateUrl: true,
			}).success,
		).toBe(false);
	});
});
