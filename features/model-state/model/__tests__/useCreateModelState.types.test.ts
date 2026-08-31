jest.mock("@shapediver/viewer.shared.types", () => ({
	CAMERA_TYPE: {
		PERSPECTIVE: "perspective",
		ORTHOGRAPHIC: "orthographic",
	},
}));

import {CreateModelStateHookThemeDefaultPropsSchema} from "../useCreateModelState.types";

describe("CreateModelStateHookThemeDefaultPropsSchema screenshotProps", () => {
	it("accepts a valid screenshotProps bag", () => {
		expect(
			CreateModelStateHookThemeDefaultPropsSchema.safeParse({
				screenshotProps: {
					contentType: "image/jpeg",
					quality: 0.8,
					resolution: {width: 256, height: 256},
				},
			}).success,
		).toBe(true);
	});

	it("rejects screenshotProps with quality out of range", () => {
		expect(
			CreateModelStateHookThemeDefaultPropsSchema.safeParse({
				screenshotProps: {quality: 2},
			}).success,
		).toBe(false);
	});
});
