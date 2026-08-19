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

import {validateStringParameterSettings} from "../appbuildertypecheck";

describe("validateStringParameterSettings", () => {
	it("accepts {lines: 3}", () => {
		const result = validateStringParameterSettings({lines: 3});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.lines).toBe(3);
		}
	});

	it('accepts {mode: "validate", debounce: 3000}', () => {
		const result = validateStringParameterSettings({
			mode: "validate",
			debounce: 3000,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.mode).toBe("validate");
			expect(result.data.debounce).toBe(3000);
		}
	});

	it('accepts {mode: "debounce", debounce: 0}', () => {
		const result = validateStringParameterSettings({
			mode: "debounce",
			debounce: 0,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.mode).toBe("debounce");
			expect(result.data.debounce).toBe(0);
		}
	});

	it('rejects {mode: "instant"}', () => {
		const result = validateStringParameterSettings({mode: "instant"});
		expect(result.success).toBe(false);
	});

	it("rejects {debounce: 1.5}", () => {
		const result = validateStringParameterSettings({debounce: 1.5});
		expect(result.success).toBe(false);
	});

	it("rejects {debounce: -1}", () => {
		const result = validateStringParameterSettings({debounce: -1});
		expect(result.success).toBe(false);
	});
});
