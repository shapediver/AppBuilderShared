jest.mock("@shapediver/viewer.session", () => ({
	PARAMETER_TYPE: {
		Bool: "Bool",
		Float: "Float",
		String: "String",
	},
	PARAMETER_VISUALIZATION: {},
	TAG3D_JUSTIFICATION: {},
}));

jest.mock("@shapediver/viewer.shared.types", () => ({
	ATTRIBUTE_VISUALIZATION: {},
	CAMERA_TYPE: {},
}));

import * as fs from "node:fs";
import {
	formatAppBuilderZodError,
	validateAppBuilderSettingsJson,
} from "../appbuildertypecheck";

const settingsFile = process.env.VALIDATE_SETTINGS_FILE;

describe("validateSettingsJsonFile CLI", () => {
	(settingsFile ? it : it.skip)(
		`validates ${settingsFile ?? "<VALIDATE_SETTINGS_FILE>"}`,
		() => {
			const raw = fs.readFileSync(settingsFile!, "utf8");
			let json: unknown;
			try {
				json = JSON.parse(raw);
			} catch (error) {
				throw new Error(
					`Invalid JSON in ${settingsFile}: ${error instanceof Error ? error.message : String(error)}`,
				);
			}

			const result = validateAppBuilderSettingsJson(json);
			if (!result.success) {
				throw new Error(
					`Settings JSON invalid (${settingsFile}):\n${formatAppBuilderZodError(result.error)}`,
				);
			}
		},
	);
});
