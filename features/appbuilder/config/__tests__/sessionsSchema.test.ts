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

import {validateAppBuilder} from "../appbuildertypecheck";

const layout = (sessions?: unknown) => ({
	version: "1.0" as const,
	containers: [],
	...(sessions === undefined ? {} : {sessions}),
});

describe("IAppBuilder.sessions schema", () => {
	it("accepts a layout with no sessions property", () => {
		expect(validateAppBuilder(layout()).success).toBe(true);
	});

	it("accepts a session id, slug, and parameter values", () => {
		const result = validateAppBuilder(
			layout([
				{
					sessionId: "secondary",
					slug: "other-model",
					parameterValues: {
						Width: 5,
						Label: "oak",
						Visible: true,
						Image: {type: "dataOutput", props: {name: "Image"}},
					},
				},
			]),
		);
		expect(result.success).toBe(true);
	});

	it("accepts a session with only a session id", () => {
		const result = validateAppBuilder(layout([{sessionId: "secondary"}]));
		expect(result.success).toBe(true);
	});

	it("rejects a session missing sessionId", () => {
		const result = validateAppBuilder(layout([{slug: "other-model"}]));
		expect(result.success).toBe(false);
	});

	it("rejects instance-only keys on a session", () => {
		const result = validateAppBuilder(
			layout([{sessionId: "secondary", transformations: [[1]]}]),
		);
		expect(result.success).toBe(false);
	});

	it("rejects sessions that are not an array", () => {
		const result = validateAppBuilder(layout({sessionId: "secondary"}));
		expect(result.success).toBe(false);
	});
});
