jest.mock("@shapediver/viewer.shared.types", () => ({
	CAMERA_TYPE: {
		PERSPECTIVE: "perspective",
		ORTHOGRAPHIC: "orthographic",
	},
}));

import {AddToCartActionThemeDefaultPropsSchema} from "../AddToCartAction.theme.types";

describe("AddToCartActionThemeDefaultPropsSchema", () => {
	it("accepts screenshotProps with quality and resolution", () => {
		expect(
			AddToCartActionThemeDefaultPropsSchema.safeParse({
				screenshotProps: {
					quality: 0.8,
					resolution: {width: 256, height: 256},
				},
			}).success,
		).toBe(true);
	});

	it("accepts successMessage without screenshotProps", () => {
		expect(
			AddToCartActionThemeDefaultPropsSchema.safeParse({
				successMessage: "x",
			}).success,
		).toBe(true);
	});

	it("rejects screenshotProps with quality above 1", () => {
		expect(
			AddToCartActionThemeDefaultPropsSchema.safeParse({
				screenshotProps: {quality: 2},
			}).success,
		).toBe(false);
	});

	it("rejects unknown keys", () => {
		expect(
			AddToCartActionThemeDefaultPropsSchema.safeParse({
				notARealProp: true,
			}).success,
		).toBe(false);
	});
});
