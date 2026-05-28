import * as fs from "node:fs";
import * as path from "node:path";
import {
	formatAppBuilderZodError,
	validateAppBuilderSettingsJson,
} from "./appbuildertypecheck";

const FIXTURES_DIR = path.join(__dirname, "__fixtures__");
const ERROR_SUMMARY_MAX = 500;

type FixtureResult = {
	file: string;
	status: "PASS" | "FAIL" | "SKIP";
	skipReason?: string;
	errorSummary?: string;
};

function isSettingsFixture(json: unknown): boolean {
	if (!json || typeof json !== "object") return false;
	const record = json as Record<string, unknown>;
	if (record.version === "1.0") return true;
	if (record.appBuilderOverride != null) return true;
	return false;
}

function collectFixtureJsonFiles(): string[] {
	return fs
		.readdirSync(FIXTURES_DIR)
		.filter((name) => name.endsWith(".json"))
		.sort((a, b) => a.localeCompare(b));
}

describe("validateAppBuilderSettingsJson co-located fixtures", () => {
	const results: FixtureResult[] = [];

	afterAll(() => {
		const pass = results.filter((r) => r.status === "PASS");
		const fail = results.filter((r) => r.status === "FAIL");
		const skip = results.filter((r) => r.status === "SKIP");

		// eslint-disable-next-line no-console
		console.log("\n--- __fixtures__/*.json validation summary ---");
		for (const r of results) {
			if (r.status === "SKIP") {
				// eslint-disable-next-line no-console
				console.log(`${r.file}: SKIP (${r.skipReason})`);
				continue;
			}
			// eslint-disable-next-line no-console
			console.log(`${r.file}: ${r.status}`);
			if (r.status === "FAIL" && r.errorSummary) {
				// eslint-disable-next-line no-console
				console.log(r.errorSummary);
			}
		}
		// eslint-disable-next-line no-console
		console.log(
			`\nTotal: ${results.length} | PASS: ${pass.length} | FAIL: ${fail.length} | SKIP: ${skip.length}`,
		);
	});

	for (const fileName of collectFixtureJsonFiles()) {
		it(fileName, () => {
			const filePath = path.join(FIXTURES_DIR, fileName);
			const json = JSON.parse(fs.readFileSync(filePath, "utf8"));

			if (!isSettingsFixture(json)) {
				results.push({
					file: fileName,
					status: "SKIP",
					skipReason: "no version 1.0 or appBuilderOverride",
				});
				return;
			}

			const result = validateAppBuilderSettingsJson(json);
			if (result.success) {
				results.push({file: fileName, status: "PASS"});
				return;
			}

			const errorSummary = formatAppBuilderZodError(result.error).slice(
				0,
				ERROR_SUMMARY_MAX,
			);
			results.push({
				file: fileName,
				status: "FAIL",
				errorSummary,
			});
			expect(result.success).toBe(true);
		});
	}
});
