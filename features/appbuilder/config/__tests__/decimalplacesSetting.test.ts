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
import {
	numericSliderControls,
	sliderDecimalPlaces,
} from "@AppBuilderLib/entities/parameter/lib/numericSliderValue";
import {applyOverrides} from "@AppBuilderLib/lib/mergeOverrides";
import {validateNumberParameterSettings} from "../appbuildertypecheck";

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

const withSettings = (
	settings: Record<string, unknown>,
	base: IShapeDiverParameterDefinition = definition,
) => applyOverrides(base, {settings});

describe("settings.decimalplaces", () => {
	it("is accepted as a number setting", () => {
		const result = validateNumberParameterSettings({decimalplaces: 0});
		expect(result.success && result.data.decimalplaces).toBe(0);
	});

	it.each([-1, 1.5, 101, "2"])(
		"ignores %p without dropping the other settings",
		(value) => {
			const result = validateNumberParameterSettings({
				decimalplaces: value,
				step: 0.5,
			});
			expect(result.success).toBe(true);
			expect(result.success && result.data.decimalplaces).toBeUndefined();
			expect(result.success && result.data.step).toBe(0.5);
		},
	);

	it("keeps the parameter's decimal places without the setting", () => {
		const slider = numericSliderControls(definition);
		expect(slider.decimalplaces).toBe(2);
		expect(slider.step).toBe(0.01);
		expect(slider.project(1.256)).toBe(1.26);
	});

	it("reduces the step and rounding of the slider", () => {
		const slider = numericSliderControls(withSettings({decimalplaces: 0}));
		expect(slider.decimalplaces).toBe(0);
		expect(slider.step).toBe(1);
		expect(slider.project(1.6)).toBe(2);
	});

	it("ignores a setting which does not reduce the decimal places", () => {
		// values are sent with the decimal places of the model
		expect(sliderDecimalPlaces(withSettings({decimalplaces: 3}))).toBe(2);
		expect(
			sliderDecimalPlaces(
				withSettings(
					{decimalplaces: 0},
					{...definition, type: "Int", decimalplaces: undefined},
				),
			),
		).toBe(0);
	});

	it("is merged with the other settings of an override", () => {
		const overridden = applyOverrides(
			{...definition, settings: {step: 0.5}},
			{settings: {decimalplaces: 1}},
		);
		const slider = numericSliderControls(overridden);
		expect(slider.decimalplaces).toBe(1);
		expect(slider.step).toBe(0.5);
	});

	it("never gets a step of 0 from a step finer than the decimal places", () => {
		const slider = numericSliderControls(
			withSettings({decimalplaces: 0}, {...definition, step: 0.25}),
		);
		expect(slider.step).toBe(1);
		expect(slider.project(1.6)).toBe(2);
	});

	it("stays inside a range the decimal places cannot represent", () => {
		const slider = numericSliderControls(
			withSettings(
				{decimalplaces: 0},
				{...definition, min: 0.4, max: 9.6},
			),
		);
		expect(slider.project(0.4)).toBe(1);
		expect(slider.project(9.6)).toBe(9);

		// no integer between min and max: the clamped value is kept
		const narrow = numericSliderControls(
			withSettings(
				{decimalplaces: 0},
				{...definition, min: 0.25, max: 0.75},
			),
		);
		expect(narrow.project(0.1)).toBeGreaterThanOrEqual(0.25);
		expect(narrow.project(0.9)).toBeLessThanOrEqual(0.75);
	});

	it("stays inside the range narrowed by settings", () => {
		const slider = numericSliderControls(
			withSettings({decimalplaces: 0, min: 0.4, max: 9.6}),
		);
		expect(slider.project(0)).toBe(1);
		expect(slider.project(10)).toBe(9);
		// the bound marks show the values the slider can commit
		expect(slider.marks).toEqual([
			{value: 1, label: "1"},
			{value: 9, label: "9"},
		]);
	});

	it("puts marks at values the slider can commit", () => {
		const slider = numericSliderControls(
			withSettings({
				decimalplaces: 1,
				restrictToMarks: true,
				marks: [
					{value: 0.25, label: "a"},
					{value: 0.26, label: "b"},
					{value: 0.75},
				],
			}),
		);
		// 0.25 and 0.26 both round to 0.3: the first one is kept
		expect(slider.marks).toEqual([{value: 0.3, label: "a"}, {value: 0.8}]);
		expect(slider.project(0.2)).toBe(0.3);
		expect(slider.project(0.7)).toBe(0.8);
	});
});
