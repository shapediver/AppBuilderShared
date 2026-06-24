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
import * as path from "node:path";
import {skillExamples} from "./skillExamples.data";
import {
	formatAppBuilderZodError,
	validateAppBuilderSettingsJson,
} from "../appbuildertypecheck";

const SHOULD_PASS = [
	"minimal-brand",
	"typography-only",
	"appshell-layout",
	"nested-bottom-bar",
	"viewport-icons",
	"session-plus-theme",
	"appbuilder-override-sticky-tabs",
] as const;

const SHOULD_FAIL = ["invalid-button-props", "invalid-wrap-flex"] as const;

/** Committed public fixtures from skill examples.md that pass strict validation */
const COMMITTED_PUBLIC_FIXTURES = [
	"example-appBuilderOverride.json",
	"example-themeOverrides-appshellTemplateExample01.json",
	"example-sessions-slug.json",
	"example-sessions-ticket.json",
	"blank.json",
	"SS-9463.json",
] as const;

const PUBLIC_DIR = path.join(process.cwd(), "public");

describe("skill examples.md profiles (shapediver-appbuilder-settings)", () => {
	for (const name of SHOULD_PASS) {
		it(`accepts profile: ${name}`, () => {
			const result = validateAppBuilderSettingsJson(skillExamples[name]);
			if (!result.success) {
				throw new Error(
					`${name}: ${formatAppBuilderZodError(result.error)}`,
				);
			}
			expect(result.success).toBe(true);
		});
	}

	for (const name of SHOULD_FAIL) {
		it(`rejects profile: ${name}`, () => {
			const result = validateAppBuilderSettingsJson(skillExamples[name]);
			expect(result.success).toBe(false);
		});
	}

	for (const file of COMMITTED_PUBLIC_FIXTURES) {
		it(`accepts committed public fixture: ${file}`, () => {
			const raw = JSON.parse(
				fs.readFileSync(path.join(PUBLIC_DIR, file), "utf8"),
			);
			const result = validateAppBuilderSettingsJson(raw);
			if (!result.success) {
				throw new Error(
					`${file}: ${formatAppBuilderZodError(result.error)}`,
				);
			}
			expect(result.success).toBe(true);
		});
	}
});
