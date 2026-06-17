import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import * as fs from "node:fs";
import * as path from "node:path";
import {ParameterColorComponentThemeDefaultPropsSchema} from "~/shared/entities/parameter/config/ParameterColorComponent.types";
import {
	formatAppBuilderZodError,
	validateAppBuilderSettingsJson,
} from "../appbuildertypecheck";

/** `src/shared` root (this file: features/appbuilder/config/__tests__). */
const SHARED_SRC_ROOT = path.resolve(__dirname, "../../../..");

/** Modules allowed to import `themeComponentDefaultPropsRegistry` (settings JSON pipeline only). */
const ALLOWED_THEME_REGISTRY_IMPORTERS = new Set([
	"features/appbuilder/config/themeComponentDefaultPropsRegistry.ts",
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
		component: "AppBuilderImage",
		validDefaultProps: {radius: "md", fit: "contain", withBorder: false},
		invalidDefaultProps: {fit: "cover"},
	},
	{
		component: "AppBuilderStackUiWidgetComponent",
		validDefaultProps: {iconForwardProps: {size: "sm", stroke: "1px"}},
		invalidDefaultProps: {iconForwardProps: {size: true}},
	},
	{
		component: "DesktopClientPanel",
		validDefaultProps: {statusIconProps: {size: "sm", stroke: "1px"}},
		invalidDefaultProps: {selectProps: {label: 42}},
	},
	{
		component: "AppBuilderFormWidgetComponent",
		validDefaultProps: {resetMessage: "Reset form", stackProps: {gap: 0}},
		invalidDefaultProps: {resetMessage: true},
	},
	{
		component: "AppBuilderControlsWidgetComponent",
		validDefaultProps: {elementPaperProps: {shadow: "none"}},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "AppBuilderAccordionUiWidgetComponent",
		validDefaultProps: {accordionPaperProps: {px: 0, py: 0}},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "ParametersAndExportsAccordionComponent",
		validDefaultProps: {avoidSingleComponentGroups: true, pbSlider: "md"},
		invalidDefaultProps: {pbSlider: true},
	},
	{
		component: "AppBuilderTextWidgetComponent",
		validDefaultProps: {shadow: "sm", withBorder: true},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "AppBuilderActionComponent",
		validDefaultProps: {variant: "filled", fullWidth: true},
		invalidDefaultProps: {variant: 123},
	},
	{
		component: "AppBuilderAttributeVisualizationWidgetComponent",
		validDefaultProps: {
			widgetGroupProps: {justify: "space-between"},
			titleProps: {style: {fontWeight: 600}},
		},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "AppBuilderSavedStatesWidgetComponent",
		validDefaultProps: {paperProps: {p: "md"}, stackProps: {gap: "md"}},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "AppBuilderLineChartWidgetComponent",
		validDefaultProps: {
			widgetProps: {shadow: "sm"},
			lineChartProps: {h: 250},
		},
		invalidDefaultProps: {lineChartProps: {h: "tall"}},
	},
	{
		component: "AppBuilderBarChartWidgetComponent",
		validDefaultProps: {
			titleProps: {style: {marginBottom: "20px"}},
			barChartProps: {h: 200},
		},
		invalidDefaultProps: {barChartProps: {h: true}},
	},
	{
		component: "AppBuilderAreaChartWidgetComponent",
		validDefaultProps: {
			widgetProps: {withBorder: true},
			areaChartProps: {h: 300},
		},
		invalidDefaultProps: {areaChartProps: {h: "300"}},
	},
	{
		component: "AppBuilderRoundChartWidgetComponent",
		validDefaultProps: {
			pieChartProps: {h: 250},
			badgeProps: {style: {marginRight: "10px"}},
		},
		invalidDefaultProps: {badgeProps: {style: "invalid"}},
	},
	{
		component: "AppBuilderAgentWidgetComponent",
		validDefaultProps: {
			shadow: "sm",
			model: "gpt-4o-mini",
			maxHistory: 10,
		},
		invalidDefaultProps: {maxHistory: "ten"},
	},
	{
		component: "AppBuilderTableWidgetComponent",
		validDefaultProps: {
			searchTextInputProps: {size: "xs"},
			searchBarProps: {py: "xs"},
		},
		invalidDefaultProps: {searchTextInputProps: {size: true}},
	},
	{
		component: "AppBuilderAccordionWidgetComponent",
		validDefaultProps: {showAcceptRejectButtons: true},
		invalidDefaultProps: {showAcceptRejectButtons: "yes"},
	},
	{
		component: "AppBuilderContainerWrapper",
		validDefaultProps: {containerThemeOverrides: {}},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "AppBuilderAppShellTemplatePage",
		validDefaultProps: {
			headerHeight: {base: "4em", md: "4em"},
			columns: 3,
			navbarBorder: true,
		},
		invalidDefaultProps: {columns: "three"},
	},
	{
		component: "AppBuilderGridTemplatePage",
		validDefaultProps: {columns: 4, rows: 4, bgTop: "transparent"},
		invalidDefaultProps: {columns: "four"},
	},
	{
		component: "DefaultSession",
		validDefaultProps: {
			acceptRejectMode: false,
			slug: "demo",
			platformUrl: "https://example.com",
		},
		invalidDefaultProps: {acceptRejectMode: "no"},
	},
	{
		component: "MarkdownWidgetComponent",
		validDefaultProps: {
			anchorTarget: "_blank",
			themeOverride: {primaryColor: "blue"},
		},
		invalidDefaultProps: {setHeadingFontSize: "yes"},
	},
	{
		component: "CreateModelStateHook",
		validDefaultProps: {parameterNamesToInclude: ["width"]},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "ExportButtonComponent",
		validDefaultProps: {
			buttonProps: {variant: "filled"},
			downloadTooltipProps: {label: "Download"},
		},
		invalidDefaultProps: {buttonProps: {variant: 123}},
	},
	{
		component: "ExportLabelComponent",
		validDefaultProps: {fontWeight: "500"},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "Hint",
		validDefaultProps: {iconProps: {size: "sm", stroke: "1px"}},
		invalidDefaultProps: {iconProps: {size: true}},
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
		component: "ModalBase",
		validDefaultProps: {size: "md", centered: true},
		invalidDefaultProps: {size: true},
	},
	{
		component: "MultiSelectCheckboxes",
		validDefaultProps: {stackProps: {gap: "xs"}},
		invalidDefaultProps: {checkboxProps: {ml: true}},
	},
	{
		component: "OutputChunkLabelComponent",
		validDefaultProps: {fontWeight: "600"},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "OutputStargateComponent",
		validDefaultProps: {paperProps: {shadow: "none"}},
		invalidDefaultProps: {paperProps: {shadow: 123}},
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
		component: "ParameterLabelComponent",
		validDefaultProps: {
			fontWeight: "500",
			tooltipProps: {label: "Cancel change", position: "top"},
		},
		invalidDefaultProps: {fontWeight: true},
	},
	{
		component: "ParameterStargateComponent",
		validDefaultProps: {
			tooltipProps: {label: "Clear selection"},
			actionIconProps: {variant: "transparent"},
			iconProps: {size: "1.2rem"},
		},
		invalidDefaultProps: {actionIconProps: {variant: 123}},
	},
	{
		component: "ParameterRectangleTransformComponent",
		validDefaultProps: {
			enableRotation: true,
			enableScaling: true,
			enableTranslation: true,
		},
		invalidDefaultProps: {enableRotation: "yes"},
	},
	{
		component: "ParameterSelectComponent",
		validDefaultProps: {
			componentSettings: {
				Width: {
					type: "grid",
					settings: {gridProps: {cols: {base: 2}, spacing: "xs"}},
				},
			},
		},
		invalidDefaultProps: {
			componentSettings: {Width: {type: "not-a-select-type"}},
		},
	},
	{
		component: "SelectGridComponent",
		validDefaultProps: {
			gridProps: {cols: 2, spacing: "xs"},
			showLabel: true,
			imageProps: {fit: "contain"},
		},
		invalidDefaultProps: {gridProps: {cols: "two"}},
	},
	{
		component: "SelectCarouselComponent",
		validDefaultProps: {
			carouselProps: {withIndicators: false, type: "container"},
			showLabel: true,
		},
		invalidDefaultProps: {carouselProps: {type: "invalid"}},
	},
	{
		component: "SelectFullWidthCardsComponent",
		validDefaultProps: {
			groupProps: {wrap: "nowrap"},
			imageProps: {w: "100px", fit: "contain"},
			searchable: false,
		},
		invalidDefaultProps: {searchable: "no"},
	},
	{
		component: "StargateInput",
		validDefaultProps: {loaderProps: {type: "dots", size: "sm"}},
		invalidDefaultProps: {loaderProps: {type: 42}},
	},
	{
		component: "StargateShared",
		validDefaultProps: {
			stargateColorProps: {
				primary: "var(--mantine-primary-color-filled)",
			},
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
		validDefaultProps: {
			floating: true,
			label: "Hint",
			themeOverride: {primaryColor: "blue"},
		},
		invalidDefaultProps: {__unrecognizedThemeKey: true},
	},
	{
		component: "ViewportAcceptRejectButtons",
		validDefaultProps: {showButtons: true, iconProps: {size: "sm"}},
		invalidDefaultProps: {showButtons: "yes"},
	},
	{
		component: "ViewportBranding",
		validDefaultProps: {
			dark: {logo: null, backgroundColor: "#000"},
			light: {busyModeDisplay: "spinner"},
		},
		invalidDefaultProps: {dark: {logo: 42}},
	},
	{
		component: "ViewportComponent",
		validDefaultProps: {
			showStatistics: true,
			initialAutoAdjust: false,
			className: "viewer",
		},
		invalidDefaultProps: {showStatistics: "yes"},
	},
	{
		component: "ViewportIconButton",
		validDefaultProps: {
			actionIconProps: {variant: "subtle", size: "sm"},
			iconProps: {color: "white"},
		},
		invalidDefaultProps: {actionIconProps: {variant: 123}},
	},
	{
		component: "ViewportIconButtonDropdowns",
		validDefaultProps: {
			menuProps: {shadow: "md", position: "bottom-end"},
		},
		invalidDefaultProps: {menuProps: {shadow: 123}},
	},
	{
		component: "ViewportIcons",
		validDefaultProps: {
			enableZoomBtn: true,
			size: 24,
			paperProps: {shadow: "md"},
		},
		invalidDefaultProps: {size: "large"},
	},
	{
		component: "ViewportOverlayWrapper",
		validDefaultProps: {
			position: {base: "top-middle", md: "top-right"},
			offset: "0.5em",
		},
		invalidDefaultProps: {position: "center"},
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
		} else if (
			/\.(ts|tsx)$/.test(entry.name) &&
			!/\.(test|spec)\.(ts|tsx)$/.test(entry.name)
		) {
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
															"grid-template-columns":
																"1fr auto auto",
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
												defaultProps: {
													wrap: "invalid-wrap",
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
					ParameterColorComponent: {
						defaultProps: {colorFormat: "hexa"},
					},
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
			const rel = path
				.relative(SHARED_SRC_ROOT, filePath)
				.replace(/\\/g, "/");
			if (rel.includes("/__tests__/")) {
				continue;
			}
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

	it("useAppBuilderSettings parses settings JSON via parseAppBuilderSettingsJson facade", () => {
		const source = fs.readFileSync(
			path.join(
				SHARED_SRC_ROOT,
				"features/appbuilder/model/useAppBuilderSettings.ts",
			),
			"utf8",
		);
		expect(source).toMatch(/from\s+["'].*parseAppBuilderJson["']/);
		expect(source.match(/parseAppBuilderSettingsJson\s*\(/g)).toHaveLength(
			1,
		);
		expect(source).not.toMatch(/validateAppBuilderSettingsJson/);
		expect(source).not.toMatch(/isAppBuilderValidationEnabled/);
		expect(source).not.toMatch(/formatAppBuilderZodError/);
		expect(source).not.toMatch(
			/setThemeOverride[\s\S]*parseAppBuilderSettingsJson/,
		);
	});

	it("useSessionWithAppBuilder parses model skeleton via facade; override is not re-validated", () => {
		const source = fs.readFileSync(
			path.join(
				SHARED_SRC_ROOT,
				"features/appbuilder/model/useSessionWithAppBuilder.ts",
			),
			"utf8",
		);
		expect(source).toMatch(/from\s+["'].*parseAppBuilderJson["']/);
		expect(source.match(/parseAppBuilderSkeleton\s*\(/g)).toHaveLength(2);
		expect(source).not.toMatch(/validateAppBuilder/);
		expect(source).not.toMatch(/isAppBuilderValidationEnabled/);
		expect(source).not.toMatch(/formatAppBuilderZodError/);
		expect(source).toMatch(
			/appBuilderOverride\s*&&\s*sessionInitialized[\s\S]*return\s+appBuilderOverride/,
		);
		expect(source).not.toMatch(
			/parseAppBuilderSkeleton\s*\(\s*appBuilderOverride/,
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
