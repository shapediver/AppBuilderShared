jest.mock("@shapediver/viewer.session", () => ({
	PARAMETER_TYPE: {
		Bool: "Bool",
		Float: "Float",
		String: "String",
		StringList: "StringList",
		File: "File",
		Color: "Color",
		Int: "Int",
		Even: "Even",
		Odd: "Odd",
		Drawing: "Drawing",
		Interaction: "Interaction",
	},
	PARAMETER_VISUALIZATION: {
		SLIDER: "slider",
	},
	TAG3D_JUSTIFICATION: {
		LEFT: "left",
		CENTER: "center",
		RIGHT: "right",
	},
}));

jest.mock("@shapediver/viewer.shared.types", () => ({
	ATTRIBUTE_VISUALIZATION: {
		LINEAR: "linear",
	},
	CAMERA_TYPE: {
		PERSPECTIVE: "perspective",
		ORTHOGRAPHIC: "orthographic",
	},
}));

import {validateAppBuilder} from "../appbuildertypecheck";

describe("Interaction parameter schema", () => {
	describe("anchor selectionProperties", () => {
		it("accepts activeMode: alwaysActive in anchor 3d selectionProperties", () => {
			const result = validateAppBuilder({
				version: "1.0",
				containers: [
					{
						name: "anchor3d",
						props: {
							id: "a1",
							location: [0, 0, 0],
							selectionProperties: {
								activeMode: "alwaysActive",
							},
						},
					},
				],
			});
			expect(result.success).toBe(true);
		});

		it("accepts activeMode: activeOnStart in anchor selectionProperties", () => {
			const result = validateAppBuilder({
				version: "1.0",
				containers: [
					{
						name: "anchor3d",
						props: {
							id: "a1",
							location: [0, 0, 0],
							selectionProperties: {
								activeMode: "activeOnStart",
							},
						},
					},
				],
			});
			expect(result.success).toBe(true);
		});

		it("accepts presentation: toolbar in anchor selectionProperties", () => {
			const result = validateAppBuilder({
				version: "1.0",
				containers: [
					{
						name: "anchor3d",
						props: {
							id: "a1",
							location: [0, 0, 0],
							selectionProperties: {
								presentation: "toolbar",
							},
						},
					},
				],
			});
			expect(result.success).toBe(true);
		});

		it("accepts presentation: widget in anchor selectionProperties", () => {
			const result = validateAppBuilder({
				version: "1.0",
				containers: [
					{
						name: "anchor3d",
						props: {
							id: "a1",
							location: [0, 0, 0],
							selectionProperties: {
								presentation: "widget",
							},
						},
					},
				],
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid activeMode value", () => {
			const result = validateAppBuilder({
				version: "1.0",
				containers: [
					{
						name: "anchor3d",
						props: {
							id: "a1",
							location: [0, 0, 0],
							selectionProperties: {
								activeMode: "invalid",
							},
						},
					},
				],
			});
			expect(result.success).toBe(false);
		});

		it("rejects invalid presentation value", () => {
			const result = validateAppBuilder({
				version: "1.0",
				containers: [
					{
						name: "anchor3d",
						props: {
							id: "a1",
							location: [0, 0, 0],
							selectionProperties: {
								presentation: "invalid",
							},
						},
					},
				],
			});
			expect(result.success).toBe(false);
		});


		it("accepts combined alwaysActive + toolbar presentation", () => {
			const result = validateAppBuilder({
				version: "1.0",
				containers: [
					{
						name: "anchor3d",
						props: {
							id: "a1",
							location: [0, 0, 0],
							selectionProperties: {
								activeMode: "alwaysActive",
								presentation: "toolbar",
							},
						},
					},
				],
			});
			expect(result.success).toBe(true);
		});
	});

	describe("anchor 2d selectionProperties", () => {
		it("accepts activeMode: alwaysActive in anchor 2d selectionProperties", () => {
			const result = validateAppBuilder({
				version: "1.0",
				containers: [
					{
						name: "anchor2d",
						props: {
							id: "a2",
							location: ["50%", "50%"],
							selectionProperties: {
								activeMode: "alwaysActive",
								presentation: "toolbar",
							},
						},
					},
				],
			});
			expect(result.success).toBe(true);
		});
	});
});
