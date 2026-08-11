jest.mock("@shapediver/viewer.shared.types", () => ({
	CAMERA_TYPE: {
		PERSPECTIVE: "perspective",
		ORTHOGRAPHIC: "orthographic",
	},
}));

import {
	createModelStateCoreSchema,
	createModelStateDataSchema,
} from "../createModelState.zod";

describe("createModelStateCoreSchema screenshotProps", () => {
	it("accepts screenshotProps on the core schema", () => {
		expect(
			createModelStateCoreSchema.safeParse({
				screenshotProps: {contentType: "image/jpeg", quality: 0.5},
			}).success,
		).toBe(true);
	});

	it("accepts omission of screenshotProps", () => {
		expect(createModelStateCoreSchema.safeParse({}).success).toBe(true);
	});

	it("rejects malformed screenshotProps", () => {
		expect(
			createModelStateCoreSchema.safeParse({
				screenshotProps: {quality: 2},
			}).success,
		).toBe(false);
	});
});

describe("createModelStateDataSchema screenshotProps", () => {
	it("accepts screenshotProps alongside image and data", () => {
		expect(
			createModelStateDataSchema.safeParse({
				image: {href: "https://example.com/img.png"},
				data: {foo: "bar"},
				screenshotProps: {resolution: {width: 800, height: 600}},
			}).success,
		).toBe(true);
	});
});
