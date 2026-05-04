import {formatAppBuilderZodError, validateAppBuilderSettingsJson} from "./appbuildertypecheck";

const minimalValidSettings = {
	version: "1.0" as const,
};

describe("validateAppBuilderSettingsJson theme component defaultProps", () => {
	it("fails when registered Icon defaultProps violate schema", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
			themeOverrides: {
				components: {
					Icon: {
						defaultProps: {
							size: true,
						},
					},
				},
			},
		});

		expect(result.success).toBe(false);
		if (result.success) return;
		const msg = formatAppBuilderZodError(result.error);
		expect(msg).toMatch(/themeOverrides/i);
		expect(msg).toMatch(/components/i);
		expect(msg).toMatch(/Icon/i);
		expect(msg).toMatch(/defaultProps/i);
	});

	it("does not deep-validate unknown component keys (policy: registry only)", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
			themeOverrides: {
				components: {
					NotRegisteredInAppBuilderRegistry123: {
						defaultProps: {
							anything: {nested: true},
							size: false,
						},
					},
				},
			},
		});

		expect(result.success).toBe(true);
	});
});
