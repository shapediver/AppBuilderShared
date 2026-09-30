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

const app = (
	presentation: unknown,
	controlPresentation: unknown = "global",
) => ({
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
								acceptRejectMode: true,
								acceptRejectModePresentation: presentation,
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
									acceptRejectMode: true,
									acceptRejectModePresentation:
										controlPresentation,
								},
							},
						],
					},
				},
			],
		},
	],
});

describe("acceptRejectModePresentation", () => {
	it("accepts global and inline on a parameter and a parameter control", () => {
		expect(validateAppBuilder(app("inline", "global")).success).toBe(true);
	});

	it("rejects an unknown presentation", () => {
		expect(validateAppBuilder(app("beside")).success).toBe(false);
	});
});
