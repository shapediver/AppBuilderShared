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

	it("fails when registered ParameterColorComponent defaultProps violate schema", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
			themeOverrides: {
				components: {
					ParameterColorComponent: {
						defaultProps: {
							colorFormat: "cmyk",
						},
					},
				},
			},
		});

		expect(result.success).toBe(false);
		if (result.success) return;
		const msg = formatAppBuilderZodError(result.error);
		expect(msg).toMatch(/ParameterColorComponent/i);
		expect(msg).toMatch(/defaultProps/i);
	});

	it("fails when registered StargateShared defaultProps violate schema", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
			themeOverrides: {
				components: {
					StargateShared: {
						defaultProps: {
							stargateColorProps: {
								primary: 42,
							},
						},
					},
				},
			},
		});

		expect(result.success).toBe(false);
		if (result.success) return;
		const msg = formatAppBuilderZodError(result.error);
		expect(msg).toMatch(/StargateShared/i);
		expect(msg).toMatch(/defaultProps/i);
	});

	it("fails when registered CreateModelStateHook defaultProps violate schema", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
			themeOverrides: {
				components: {
					CreateModelStateHook: {
						defaultProps: {
							parameterNamesToInclude: "not-an-array",
						},
					},
				},
			},
		});

		expect(result.success).toBe(false);
		if (result.success) return;
		const msg = formatAppBuilderZodError(result.error);
		expect(msg).toMatch(/CreateModelStateHook/i);
		expect(msg).toMatch(/defaultProps/i);
	});

	it("fails when registered NotificationWrapper defaultProps violate schema", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
			themeOverrides: {
				components: {
					NotificationWrapper: {
						defaultProps: {
							autoClose: "forever",
						},
					},
				},
			},
		});

		expect(result.success).toBe(false);
		if (result.success) return;
		const msg = formatAppBuilderZodError(result.error);
		expect(msg).toMatch(/NotificationWrapper/i);
		expect(msg).toMatch(/defaultProps/i);
	});

	it("fails when registered LoaderPage defaultProps violate schema", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
			themeOverrides: {
				components: {
					LoaderPage: {
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
		expect(msg).toMatch(/LoaderPage/i);
		expect(msg).toMatch(/defaultProps/i);
	});

	it("fails when registered AppBuilderTemplateSelector defaultProps violate schema", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
			themeOverrides: {
				components: {
					AppBuilderTemplateSelector: {
						defaultProps: {
							template: "single-page",
						},
					},
				},
			},
		});

		expect(result.success).toBe(false);
		if (result.success) return;
		const msg = formatAppBuilderZodError(result.error);
		expect(msg).toMatch(/AppBuilderTemplateSelector/i);
		expect(msg).toMatch(/defaultProps/i);
	});

	it("fails when registered AppBuilderVerticalContainer defaultProps violate schema", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
			themeOverrides: {
				components: {
					AppBuilderVerticalContainer: {
						defaultProps: {
							p: false,
						},
					},
				},
			},
		});

		expect(result.success).toBe(false);
		if (result.success) return;
		const msg = formatAppBuilderZodError(result.error);
		expect(msg).toMatch(/AppBuilderVerticalContainer/i);
		expect(msg).toMatch(/defaultProps/i);
	});

	it("fails when registered AppBuilderHorizontalContainer defaultProps violate schema", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
			themeOverrides: {
				components: {
					AppBuilderHorizontalContainer: {
						defaultProps: {
							justify: 1,
						},
					},
				},
			},
		});

		expect(result.success).toBe(false);
		if (result.success) return;
		const msg = formatAppBuilderZodError(result.error);
		expect(msg).toMatch(/AppBuilderHorizontalContainer/i);
		expect(msg).toMatch(/defaultProps/i);
	});

	it("fails when registered AppBuilderContainer defaultProps violate schema", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
			themeOverrides: {
				components: {
					AppBuilderContainer: {
						defaultProps: {
							orientation: "diagonal",
						},
					},
				},
			},
		});

		expect(result.success).toBe(false);
		if (result.success) return;
		const msg = formatAppBuilderZodError(result.error);
		expect(msg).toMatch(/AppBuilderContainer/i);
		expect(msg).toMatch(/defaultProps/i);
	});
});
