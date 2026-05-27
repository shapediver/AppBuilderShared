import {ParameterColorComponentThemeDefaultPropsSchema} from "~/shared/entities/parameter/config/ParameterColorComponent.types";
import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import * as fs from "node:fs";
import * as path from "node:path";
import {formatAppBuilderZodError, validateAppBuilderSettingsJson} from "./appbuildertypecheck";

/** `src/shared` root (this file: features/appbuilder/config). */
const SHARED_SRC_ROOT = path.resolve(__dirname, "../../..");

/** Modules allowed to import `themeComponentDefaultPropsRegistry` (settings JSON pipeline only). */
const ALLOWED_THEME_REGISTRY_IMPORTERS = new Set([
	"features/appbuilder/config/appbuildertypecheck.ts",
	"features/appbuilder/config/themeComponentDefaultPropsRegistry.ts",
	"features/appbuilder/config/typedoc-theme-default-props.entry.ts",
]);

function listTypeScriptFilesUnder(dir: string, acc: string[] = []): string[] {
	for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
		if (entry.name === "node_modules" || entry.name === "dist") continue;
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			listTypeScriptFilesUnder(fullPath, acc);
		} else if (/\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\.(ts|tsx)$/.test(entry.name)) {
			acc.push(fullPath);
		}
	}
	return acc;
}

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

	it("accepts registered AppBuilderHorizontalContainer defaultProps from mantineGroupPropsSchema", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
			themeOverrides: {
				components: {
					AppBuilderHorizontalContainer: {
						defaultProps: {w: "100%", wrap: "nowrap", p: "xs"},
					},
				},
			},
		});
		expect(result.success).toBe(true);
	});

	it("fails when AppBuilderHorizontalContainer defaultProps have invalid wrap", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
			themeOverrides: {
				components: {
					AppBuilderHorizontalContainer: {
						defaultProps: {wrap: "invalid-wrap"},
					},
				},
			},
		});
		expect(result.success).toBe(false);
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

/**
 * R3 — theme `defaultProps` for registered custom components are validated only when
 * settings JSON is parsed (`validateAppBuilderSettingsJson`), not on Mantine `useProps`
 * merges when instance/theme props change at runtime.
 */
describe("validateAppBuilderSettingsJson theme validation singularity (R3)", () => {
	it("calls registry schema safeParse once per registered component per settings parse", () => {
		const iconSpy = jest.spyOn(IconThemeDefaultPropsSchema, "safeParse");
		const colorSpy = jest.spyOn(
			ParameterColorComponentThemeDefaultPropsSchema,
			"safeParse",
		);

		const result = validateAppBuilderSettingsJson({
			version: "1.0",
			themeOverrides: {
				components: {
					Icon: {defaultProps: {size: "md"}},
					ParameterColorComponent: {defaultProps: {colorFormat: "hexa"}},
				},
			},
		});

		expect(result.success).toBe(true);
		expect(iconSpy).toHaveBeenCalledTimes(1);
		expect(colorSpy).toHaveBeenCalledTimes(1);

		iconSpy.mockRestore();
		colorSpy.mockRestore();
	});

	it("does not call registry schema safeParse when settings have no themeOverrides.components", () => {
		const iconSpy = jest.spyOn(IconThemeDefaultPropsSchema, "safeParse");

		validateAppBuilderSettingsJson(minimalValidSettings);

		expect(iconSpy).not.toHaveBeenCalled();
		iconSpy.mockRestore();
	});

	it("imports themeComponentDefaultPropsRegistry only from the settings validation pipeline", () => {
		const offenders: string[] = [];

		for (const filePath of listTypeScriptFilesUnder(SHARED_SRC_ROOT)) {
			const rel = path.relative(SHARED_SRC_ROOT, filePath).replace(/\\/g, "/");
			const source = fs.readFileSync(filePath, "utf8");
			if (
				!/(?:import|from)\s+[\s\S]*themeComponentDefaultPropsRegistry/.test(
					source,
				)
			) {
				continue;
			}
			if (!ALLOWED_THEME_REGISTRY_IMPORTERS.has(rel)) {
				offenders.push(rel);
			}
		}

		expect(offenders).toEqual([]);
	});

	it("useAppBuilderSettings calls validateAppBuilderSettingsJson only in the JSON fetch path", () => {
		const source = fs.readFileSync(
			path.join(SHARED_SRC_ROOT, "features/appbuilder/model/useAppBuilderSettings.ts"),
			"utf8",
		);
		expect(source.match(/validateAppBuilderSettingsJson\s*\(/g)).toHaveLength(1);
		expect(source).toMatch(
			/const validate = \(data: any\)[\s\S]*validateAppBuilderSettingsJson\(data\)/,
		);
		expect(source).not.toMatch(
			/setThemeOverride[\s\S]*validateAppBuilderSettingsJson/,
		);
	});

	it("custom component modules do not safeParse theme JSON at runtime (useProps merge only)", () => {
		const runtimeComponentPaths = [
			"entities/parameter/ui/ParameterColorComponent.tsx",
			"entities/parameter/ui/ParameterSliderComponent.tsx",
			"shared/ui/icon/Icon.tsx",
			"pages/misc/LoaderPage.tsx",
			"pages/templates/AppBuilderTemplateSelector.tsx",
			"pages/templates/AppBuilderContainer.tsx",
		];

		for (const rel of runtimeComponentPaths) {
			const source = fs.readFileSync(
				path.join(SHARED_SRC_ROOT, rel),
				"utf8",
			);
			expect(source).not.toMatch(/validateAppBuilderSettingsJson/);
			expect(source).not.toMatch(/themeComponentDefaultPropsRegistry/);
			expect(source).not.toMatch(/ThemeDefaultPropsSchema\.safeParse/);
		}
	});
});
