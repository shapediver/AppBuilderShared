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
}));

jest.mock("@shapediver/viewer.shared.types", () => ({
	...jest.requireActual("@shapediver/viewer.shared.types"),
	ATTRIBUTE_VISUALIZATION: {
		LINEAR: "linear",
	},
	CAMERA_TYPE: {
		PERSPECTIVE: "perspective",
		ORTHOGRAPHIC: "orthographic",
	},
	TAG3D_JUSTIFICATION: {
		LEFT: "left",
		CENTER: "center",
		RIGHT: "right",
	},
}));

import type {IShapeDiverParameterDefinition} from "@AppBuilderLib/entities/parameter/config/parameter";
import {applyParameterOverrides} from "@AppBuilderLib/entities/parameter/lib/applyParameterOverrides";
import {numericSliderControls} from "@AppBuilderLib/entities/parameter/lib/numericSliderValue";
import {validateAppBuilder} from "../appbuildertypecheck";

const app = (decimalplaces: unknown, controlDecimalplaces: unknown = 1) => ({
	version: "1.0",
	containers: [
		{
			name: "left",
			widgets: [
				{
					type: "accordion",
					props: {
						parameters: [
							{
								name: "Length",
								overrides: {decimalplaces},
							},
						],
					},
				},
				{
					type: "controls",
					props: {
						controls: [
							{
								type: "parameter",
								props: {
									name: "Width",
									overrides: {
										decimalplaces: controlDecimalplaces,
									},
								},
							},
						],
					},
				},
			],
		},
	],
});

const definition = {
	id: "length",
	name: "Length",
	type: "Float",
	defval: "1.25",
	hidden: false,
	min: 0,
	max: 10,
	decimalplaces: 2,
} as IShapeDiverParameterDefinition;

describe("overrides.decimalplaces", () => {
	it("is accepted on a parameter and a parameter control", () => {
		expect(validateAppBuilder(app(0, 3)).success).toBe(true);
	});

	it.each([-1, 1.5, 101, "2"])("rejects %p", (value) => {
		expect(validateAppBuilder(app(value)).success).toBe(false);
		expect(validateAppBuilder(app(1, value)).success).toBe(false);
	});

	it("keeps the parameter's decimal places without an override", () => {
		const slider = numericSliderControls(
			applyParameterOverrides(definition, {}),
		);
		expect(slider.step).toBe(0.01);
		expect(slider.project(1.256)).toBe(1.26);
	});

	it("reduces the step and rounding of the slider", () => {
		const slider = numericSliderControls(
			applyParameterOverrides(definition, {decimalplaces: 0}),
		);
		expect(slider.step).toBe(1);
		expect(slider.project(1.6)).toBe(2);
	});

	it("ignores an override which does not reduce the decimal places", () => {
		// values are sent with the decimal places of the model
		expect(
			applyParameterOverrides(definition, {decimalplaces: 3})
				.decimalplaces,
		).toBe(2);
		expect(
			applyParameterOverrides(
				{...definition, type: "Int", decimalplaces: undefined},
				{decimalplaces: 2},
			).decimalplaces,
		).toBeUndefined();
	});

	it("keeps the other overrides", () => {
		const overridden = applyParameterOverrides(definition, {
			displayname: "L",
			decimalplaces: 1,
		});
		expect(overridden.displayname).toBe("L");
		expect(overridden.decimalplaces).toBe(1);
	});

	it("never gets a step of 0 from a step finer than the decimal places", () => {
		const slider = numericSliderControls(
			applyParameterOverrides(
				{...definition, step: 0.25},
				{decimalplaces: 0},
			),
		);
		expect(slider.step).toBe(1);
		expect(slider.project(1.6)).toBe(2);
	});

	it("stays inside a range the decimal places cannot represent", () => {
		const slider = numericSliderControls(
			applyParameterOverrides(
				{...definition, min: 0.4, max: 9.6},
				{decimalplaces: 0},
			),
		);
		expect(slider.project(0.4)).toBe(1);
		expect(slider.project(9.6)).toBe(9);

		// no integer between min and max: the clamped value is kept
		const narrow = numericSliderControls(
			applyParameterOverrides(
				{...definition, min: 0.25, max: 0.75},
				{decimalplaces: 0},
			),
		);
		expect(narrow.project(0.1)).toBeGreaterThanOrEqual(0.25);
		expect(narrow.project(0.9)).toBeLessThanOrEqual(0.75);
	});
});
