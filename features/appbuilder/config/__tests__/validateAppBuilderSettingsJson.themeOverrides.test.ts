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

import {validateAppBuilderSettingsJson} from "../appbuildertypecheck";

const headingSize = {
	fontSize: "2rem",
	fontWeight: "700",
	lineHeight: "1.2",
};

const fullHeadings = {
	fontFamily: "Inter",
	fontWeight: "600",
	textWrap: "wrap" as const,
	sizes: {
		h1: headingSize,
		h2: headingSize,
		h3: headingSize,
		h4: headingSize,
		h5: headingSize,
		h6: headingSize,
	},
};

const shade11 = Array.from({length: 11}, (_, i) => `c${i}`);
const shade10 = shade11.slice(0, 10);
const shade9 = shade11.slice(0, 9);

function settings(themeOverrides: Record<string, unknown>) {
	return {version: "1.0" as const, themeOverrides};
}

describe("validateAppBuilderSettingsJson themeOverrides", () => {
	it.each([
		["focusRing", "auto"],
		["focusRing", "always"],
		["focusRing", "never"],
		["scale", 1],
		["fontSmoothing", true],
		["white", "#fff"],
		["black", "#000"],
		["primaryColor", "blue"],
		["autoContrast", false],
		["luminanceThreshold", 0.3],
		["fontFamily", "Inter"],
		["fontFamilyMonospace", "monospace"],
		["defaultRadius", "md"],
		["defaultRadius", 8],
		["cursorType", "default"],
		["cursorType", "pointer"],
		["respectReducedMotion", true],
		["activeClassName", "active"],
		["focusClassName", "focus"],
		["primaryShade", 0],
		["primaryShade", 9],
		["primaryShade", {light: 0, dark: 9}],
		["primaryShade", {light: 9, dark: 0}],
		["fontSizes", {md: "1rem"}],
		["lineHeights", {md: "1.5"}],
		["fontWeights", {bold: "700"}],
		["radius", {md: "4px"}],
		["spacing", {md: "1rem"}],
		["breakpoints", {sm: "48em"}],
		["shadows", {sm: "0 1px 2px #000"}],
		["defaultGradient", {from: "red", to: "blue", deg: 90}],
		["headings", fullHeadings],
		["colors", {brand: shade10}],
		["colors", {brand: shade11}],
		["components", {CustomWidget: {defaultProps: {size: "md"}}}],
	] as const)("accepts themeOverrides.%s = %j", (field, value) => {
		const result = validateAppBuilderSettingsJson(
			settings({[field]: value}),
		);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.themeOverrides).toMatchObject({[field]: value});
	});

	it.each([
		["focusRing", "bogus"],
		["cursorType", "hand"],
		["defaultRadius", true],
		["primaryShade", -1],
		["primaryShade", 10],
		["primaryShade", 1.5],
		["primaryShade", {light: 0}],
		["primaryShade", {dark: 9}],
		["colors", {brand: shade9}],
		["defaultGradient", {from: "red"}],
		["headings", {textWrap: "wrap"}],
		["headings", {...fullHeadings, textWrap: "bogus"}],
	] as const)("rejects themeOverrides.%s = %j", (field, value) => {
		const result = validateAppBuilderSettingsJson(
			settings({[field]: value}),
		);
		expect(result.success).toBe(false);
	});

	it("accepts headings.textWrap enum members", () => {
		for (const textWrap of [
			"wrap",
			"nowrap",
			"balance",
			"pretty",
			"stable",
		] as const) {
			const result = validateAppBuilderSettingsJson(
				settings({headings: {...fullHeadings, textWrap}}),
			);
			expect(result.success).toBe(true);
			if (!result.success) return;
			expect(result.data.themeOverrides?.headings).toMatchObject({
				textWrap,
				sizes: fullHeadings.sizes,
			});
		}
	});

	it("does not require themeOverrides.components", () => {
		const result = validateAppBuilderSettingsJson(
			settings({primaryColor: "gray"}),
		);
		expect(result.success).toBe(true);
	});

	it("rejects non-object themeOverrides.components", () => {
		for (const components of ["nope", 1, true, null]) {
			const result = validateAppBuilderSettingsJson(
				settings({components}),
			);
			expect(result.success).toBe(false);
		}
	});

	it("prefixes nested defaultProps issues with themeOverrides.components", () => {
		const result = validateAppBuilderSettingsJson(
			settings({
				components: {
					ParameterStringComponent: {
						defaultProps: {debounce: 1.5},
					},
				},
			}),
		);
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(
			result.error.issues.some(
				(issue) =>
					issue.path.includes("themeOverrides") &&
					issue.path.includes("components"),
			),
		).toBe(true);
	});
});
