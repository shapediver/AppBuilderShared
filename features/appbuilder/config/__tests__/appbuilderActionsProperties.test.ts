jest.mock("@shapediver/viewer.shared.types", () => ({
	CAMERA_TYPE: {
		PERSPECTIVE: "perspective",
		ORTHOGRAPHIC: "orthographic",
	},
}));

import {
	IAppBuilderActionPropsAddToCartSchema,
	IAppBuilderActionPropsCameraSchema,
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

describe("camera action properties", () => {
	it("rejects direction on an explicit perspective camera", () => {
		expect(
			IAppBuilderActionPropsCameraSchema.safeParse({
				type: "assign",
				props: {
					camera: {type: "perspective", direction: "top"},
				},
			}).success,
		).toBe(false);
	});

	it("rejects fov on an explicit orthographic camera", () => {
		expect(
			IAppBuilderActionPropsCameraSchema.safeParse({
				type: "assign",
				props: {
					camera: {type: "orthographic", fov: 40},
				},
			}).success,
		).toBe(false);
	});

	it("rejects a conflicting set camera selector", () => {
		expect(
			IAppBuilderActionPropsCameraSchema.safeParse({
				type: "set",
				props: {
					position: [1, 2, 3],
					target: [0, 0, 0],
					camera: {type: "perspective", direction: "top"},
				},
			}).success,
		).toBe(false);
	});

	it("rejects a conflicting zoomTo camera selector", () => {
		expect(
			IAppBuilderActionPropsCameraSchema.safeParse({
				type: "zoomTo",
				props: {
					camera: {type: "orthographic", fov: 40},
				},
			}).success,
		).toBe(false);
	});

	it("accepts direction when the camera type is unknown at parse time", () => {
		expect(
			IAppBuilderActionPropsCameraSchema.safeParse({
				type: "assign",
				props: {
					camera: {name: "x", direction: "top"},
				},
			}).success,
		).toBe(true);
	});
});
