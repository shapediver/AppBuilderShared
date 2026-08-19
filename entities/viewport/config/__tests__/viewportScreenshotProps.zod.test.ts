jest.mock("@shapediver/viewer.shared.types", () => ({
	CAMERA_TYPE: {
		PERSPECTIVE: "perspective",
		ORTHOGRAPHIC: "orthographic",
	},
}));

import {viewportScreenshotPropsSchema} from "../viewportScreenshotProps.zod";

describe("viewportScreenshotPropsSchema", () => {
	it("accepts an empty object", () => {
		expect(viewportScreenshotPropsSchema.safeParse({}).success).toBe(true);
	});

	it("accepts contentType, quality, resolution, camera by name", () => {
		expect(
			viewportScreenshotPropsSchema.safeParse({
				contentType: "image/png",
				quality: 0.8,
				resolution: {width: 1920, height: 1080},
				camera: {name: "Camera 01"},
			}).success,
		).toBe(true);
	});

	it("accepts camera by type", () => {
		expect(
			viewportScreenshotPropsSchema.safeParse({
				camera: {type: "perspective"},
			}).success,
		).toBe(true);
	});

	it("rejects quality out of range", () => {
		expect(
			viewportScreenshotPropsSchema.safeParse({quality: 1.5}).success,
		).toBe(false);
		expect(
			viewportScreenshotPropsSchema.safeParse({quality: -0.1}).success,
		).toBe(false);
	});

	it("rejects non-positive resolution", () => {
		expect(
			viewportScreenshotPropsSchema.safeParse({
				resolution: {width: 0, height: 100},
			}).success,
		).toBe(false);
	});

	it("rejects unknown keys (strict)", () => {
		expect(
			viewportScreenshotPropsSchema.safeParse({foo: "bar"}).success,
		).toBe(false);
	});
});
