import {ParameterColorComponentThemeDefaultPropsSchema} from "~/shared/entities/parameter/config/ParameterColorComponent.types";
import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import * as fs from "node:fs";
import * as path from "node:path";
import {formatAppBuilderZodError, validateAppBuilderSettingsJson} from "./appbuildertypecheck";

/** `src/shared` root (this file: features/appbuilder/config). */
const SHARED_SRC_ROOT = path.resolve(__dirname, "../../..");

/** Modules allowed to import `themeComponentDefaultPropsRegistry` (settings JSON pipeline only). */
const ALLOWED_THEME_REGISTRY_IMPORTERS = new Set([
	"features/appbuilder/config/themeComponentDefaultPropsRegistry.ts",
	"features/appbuilder/config/typedoc-theme-default-props.entry.ts",
	"features/appbuilder/config/validateThemeComponentsRecord.ts",
]);

const minimalValidSettings = {
	version: "1.0" as const,
};

type ThemeComponentCase = {
	component: string;
	validDefaultProps: Record<string, unknown>;
	invalidDefaultProps: Record<string, unknown>;
};

/**
 * Registry entries with app-owned theme keys (excludes Mantine-only:
 * Accordion, Button, Group, Paper, Text, AppBuilderHorizontalContainer,
 * AppBuilderVerticalContainer).
 */
const APP_OWNED_THEME_COMPONENT_CASES = [
	{
		component: "AppBuilderContainer",
		validDefaultProps: {orientation: "horizontal"},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "AppBuilderTemplateSelector",
		validDefaultProps: {template: "grid", showContainerButtons: false},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "AppBuilderStackUiWidgetComponent",
		validDefaultProps: {iconForwardProps: {size: "sm", stroke: "1px"}},
		invalidDefaultProps: {iconForwardProps: {size: true}},
	},
	{
		component: "CreateModelStateHook",
		validDefaultProps: {parameterNamesToInclude: ["width"]},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "ExportLabelComponent",
		validDefaultProps: {fontWeight: "500"},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "Icon",
		validDefaultProps: {size: "md", stroke: "1px"},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "LoaderPage",
		validDefaultProps: {type: "bars", size: "md"},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "OutputChunkLabelComponent",
		validDefaultProps: {fontWeight: "600"},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "ParameterColorComponent",
		validDefaultProps: {colorFormat: "hexa"},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "ParameterSliderComponent",
		validDefaultProps: {sliderWidth: "60%", numberWidth: "35%"},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "StargateShared",
		validDefaultProps: {
			stargateColorProps: {primary: "var(--mantine-primary-color-filled)"},
		},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "NotificationWrapper",
		validDefaultProps: {autoClose: 5000, successColor: "green"},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "TooltipWrapper",
		validDefaultProps: {floating: true, label: "Hint"},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "ParameterDraggingComponent",
		validDefaultProps: {},
		invalidDefaultProps: {draggingColor: 42},
	},
	{
		component: "ParameterGumballComponent",
		validDefaultProps: {},
		invalidDefaultProps: {selectionColor: 42},
	},
	{
		component: "ParameterSelectionComponent",
		validDefaultProps: {},
		invalidDefaultProps: {selectionColor: 42},
	},
] as const satisfies readonly ThemeComponentCase[];

function themeOverridesFor(
	component: string,
	defaultProps: Record<string, unknown>,
) {
	return {
		...minimalValidSettings,
		themeOverrides: {
			components: {
				[component]: {defaultProps},
			},
		},
	};
}

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

describe("validateAppBuilderSettingsJson theme component defaultProps", () => {
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

	describe.each(APP_OWNED_THEME_COMPONENT_CASES)(
		"$component app-owned defaultProps",
		({component, validDefaultProps, invalidDefaultProps}) => {
			it("accepts minimal valid defaultProps", () => {
				const result = validateAppBuilderSettingsJson(
					themeOverridesFor(component, validDefaultProps),
				);
				expect(result.success).toBe(true);
			});

			it("rejects invalid defaultProps", () => {
				const result = validateAppBuilderSettingsJson(
					themeOverridesFor(component, invalidDefaultProps),
				);
				expect(result.success).toBe(false);
				if (result.success) return;
				const msg = formatAppBuilderZodError(result.error);
				expect(msg).toMatch(new RegExp(component, "i"));
				expect(msg).toMatch(/defaultProps/i);
			});
		},
	);

	it("validates nested AppBuilderHorizontalContainer under containerThemeOverrides", () => {
		const result = validateAppBuilderSettingsJson({
			version: "1.0",
			themeOverrides: {
				components: {
					AppBuilderContainerWrapper: {
						defaultProps: {
							containerThemeOverrides: {
								appshell: {
									bottom: {
										components: {
											AppBuilderHorizontalContainer: {
												defaultProps: {
													pt: 0,
													pb: 0,
													styles: {
														root: {
															"grid-template-columns": "1fr auto auto",
															display: "grid",
														},
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		});
		if (!result.success) {
			// eslint-disable-next-line no-console -- test diagnostics
			console.error(formatAppBuilderZodError(result.error));
		}
		expect(result.success).toBe(true);
	});

	it("fails when nested AppBuilderHorizontalContainer defaultProps have invalid wrap under containerThemeOverrides", () => {
		const result = validateAppBuilderSettingsJson({
			version: "1.0",
			themeOverrides: {
				components: {
					AppBuilderContainerWrapper: {
						defaultProps: {
							containerThemeOverrides: {
								appshell: {
									bottom: {
										components: {
											AppBuilderHorizontalContainer: {
												defaultProps: {wrap: "invalid-wrap"},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		});
		expect(result.success).toBe(false);
		if (result.success) return;
		const msg = formatAppBuilderZodError(result.error);
		expect(msg).toMatch(/containerThemeOverrides/i);
		expect(msg).toMatch(/AppBuilderHorizontalContainer/i);
		expect(msg).toMatch(/wrap/i);
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
