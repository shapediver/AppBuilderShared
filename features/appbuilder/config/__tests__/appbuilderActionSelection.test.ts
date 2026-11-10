jest.mock("@shapediver/viewer.shared.types", () => ({
	CAMERA_TYPE: {
		PERSPECTIVE: "perspective",
		ORTHOGRAPHIC: "orthographic",
	},
}));

import {IAppBuilderActionPropsSelectionSchema} from "@AppBuilderLib/features/appbuilder/config/appbuilderActionsTypecheck";

describe("selection action properties", () => {
	it("accepts select, deselect, and the parameter", () => {
		expect(
			IAppBuilderActionPropsSelectionSchema.safeParse({
				select: ["Boxes.1", "Boxes.2*"],
				deselect: ["Boxes.*"],
				parameter: {name: "Boxes", sessionId: "session"},
			}).success,
		).toBe(true);
	});

	it("accepts select or deselect alone and a parameter without sessionId", () => {
		expect(
			IAppBuilderActionPropsSelectionSchema.safeParse({select: ["a"]})
				.success,
		).toBe(true);
		expect(
			IAppBuilderActionPropsSelectionSchema.safeParse({deselect: ["a"]})
				.success,
		).toBe(true);
		expect(
			IAppBuilderActionPropsSelectionSchema.safeParse({
				select: ["a"],
				parameter: {name: "Boxes"},
			}).success,
		).toBe(true);
	});

	it("rejects invalid names and unknown properties", () => {
		expect(
			IAppBuilderActionPropsSelectionSchema.safeParse({select: "a"})
				.success,
		).toBe(false);
		expect(
			IAppBuilderActionPropsSelectionSchema.safeParse({select: [1]})
				.success,
		).toBe(false);
		expect(
			IAppBuilderActionPropsSelectionSchema.safeParse({
				select: ["a"],
				mode: "toggle",
			}).success,
		).toBe(false);
		expect(
			IAppBuilderActionPropsSelectionSchema.safeParse({
				select: ["a"],
				parameter: {},
			}).success,
		).toBe(false);
	});
});
