import {validateAppBuilderSettingsJson} from "@AppBuilderLib/features/appbuilder/config/appbuildertypecheck";

describe("settings.agentUrl", () => {
	it("accepts optional agentUrl string", () => {
		const result = validateAppBuilderSettingsJson({
			version: "1.0",
			settings: {agentUrl: "http://localhost:3001/app"},
		});
		expect(result.success).toBe(true);
	});

	it("rejects non-string agentUrl", () => {
		const result = validateAppBuilderSettingsJson({
			version: "1.0",
			settings: {agentUrl: 3001},
		});
		expect(result.success).toBe(false);
	});

	it("still accepts settings with only disableFallbackUi", () => {
		const result = validateAppBuilderSettingsJson({
			version: "1.0",
			settings: {disableFallbackUi: true},
		});
		expect(result.success).toBe(true);
	});
});
