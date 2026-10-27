/**
 * @jest-environment node
 */
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

import * as fs from "node:fs";
import * as path from "node:path";
import {
	formatAppBuilderZodError,
	validateAppBuilderSettingsJson,
} from "../appbuildertypecheck";

const PUBLIC_DIR = path.resolve(process.cwd(), "public");

const AUTOMATIC_SCENE_UPDATE_EXAMPLES = [
	"example-rectangle-basic.json",
	"example-rectangle-alwaysActive.json",
	"example-rectangle-alwaysActive-automaticSceneUpdate.json",
	"example-gumball-basic.json",
	"example-gumball-alwaysActive.json",
	"example-gumball-alwaysActive-automaticSceneUpdate.json",
	"example-gumball-alwaysActive-automaticSceneUpdate-resetValue.json",
	"example-drawing-basic.json",
	"example-drawing-alwaysActive.json",
	"example-drawing-alwaysActive-automaticSceneUpdate.json",
];

describe("automaticSceneUpdate example JSON", () => {
	it.each(AUTOMATIC_SCENE_UPDATE_EXAMPLES)("validates %s", (fileName) => {
		const raw = fs.readFileSync(path.join(PUBLIC_DIR, fileName), "utf8");
		const result = validateAppBuilderSettingsJson(JSON.parse(raw));
		if (!result.success) {
			throw new Error(formatAppBuilderZodError(result.error));
		}
	});

	it("overrides GH widget presentation on the alwaysActive drawing example", () => {
		const raw = JSON.parse(
			fs.readFileSync(
				path.join(
					PUBLIC_DIR,
					"example-drawing-alwaysActive-automaticSceneUpdate.json",
				),
				"utf8",
			),
		) as {
			appBuilderOverride: {
				containers: Array<{
					widgets: Array<{
						props: {
							parameters: Array<{
								overrides: {
									settings: {general: {presentation: string}};
								};
							}>;
						};
					}>;
				}>;
			};
		};
		expect(
			raw.appBuilderOverride.containers[0].widgets[0].props.parameters[0]
				.overrides.settings.general.presentation,
		).toBe("toolbar");
	});
});
