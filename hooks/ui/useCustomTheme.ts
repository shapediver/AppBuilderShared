import {AppBuilderImageThemeProps} from "@AppBuilderShared/components/shapediver/appbuilder/AppBuilderImage";
import {AppBuilderAgentWidgetThemeProps} from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderAgentWidgetComponent";
import {AppBuilderTextWidgetThemeProps} from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderTextWidgetComponent";
import {ExportLabelComponentThemeProps} from "@AppBuilderShared/components/shapediver/exports/ExportLabelComponent";
import {ParameterColorComponentThemeProps} from "@AppBuilderShared/components/shapediver/parameter/ParameterColorComponent";
import {ParameterLabelComponentThemeProps} from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import {ParameterSelectComponentThemeProps} from "@AppBuilderShared/components/shapediver/parameter/ParameterSelectComponent";
import {ParameterSliderComponentThemeProps} from "@AppBuilderShared/components/shapediver/parameter/ParameterSliderComponent";
import {SelectCarouselComponentThemeProps} from "@AppBuilderShared/components/shapediver/parameter/select/SelectCarouselComponent";
import {MarkdownWidgetComponentProps} from "@AppBuilderShared/components/shapediver/ui/MarkdownWidgetComponent";
import {ParametersAndExportsAccordionComponentThemeProps} from "@AppBuilderShared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import {ViewportAcceptRejectButtonsComponentThemeProps} from "@AppBuilderShared/components/shapediver/ui/ViewportAcceptRejectButtons";
import {IconThemeProps} from "@AppBuilderShared/components/ui/Icon";
import {NotificationWrapperThemeProps} from "@AppBuilderShared/components/ui/NotificationWrapper";
import {TooltipWrapperThemeProps} from "@AppBuilderShared/components/ui/TooltipWrapper";
import {DefaultSessionThemeProps} from "@AppBuilderShared/hooks/shapediver/useDefaultSessionDto";
import {LoaderPageThemeProps} from "@AppBuilderShared/pages/misc/LoaderPage";
import {AppBuilderAppShellTemplatePageThemeProps} from "@AppBuilderShared/pages/templates/AppBuilderAppShellTemplatePage";
import {AppBuilderContainerThemeProps} from "@AppBuilderShared/pages/templates/AppBuilderContainer";
import {AppBuilderContainerWrapperThemeProps} from "@AppBuilderShared/pages/templates/AppBuilderContainerWrapper";
import {AppBuilderGridTemplatePageThemeProps} from "@AppBuilderShared/pages/templates/AppBuilderGridTemplatePage";
import {AppBuilderHorizontalContainerThemeProps} from "@AppBuilderShared/pages/templates/AppBuilderHorizontalContainer";
import {AppBuilderTemplateSelectorThemeProps} from "@AppBuilderShared/pages/templates/AppBuilderTemplateSelector";
import {AppBuilderVerticalContainerThemeProps} from "@AppBuilderShared/pages/templates/AppBuilderVerticalContainer";
import {useThemeOverrideStore} from "@AppBuilderShared/store/useThemeOverrideStore";
import {
	ViewportBrandingThemeProps,
	ViewportComponentThemeProps,
} from "@AppBuilderShared/types/shapediver/viewport";
import {ViewportIconsThemeProps} from "@AppBuilderShared/types/shapediver/viewportIcons";
import {ViewportOverlayWrapperThemeProps} from "@AppBuilderShared/types/shapediver/viewportOverlayWrapper";
import {
	Accordion,
	Anchor,
	AppShellResponsiveSize,
	Button,
	CSSVariablesResolver,
	CloseButton,
	ColorInput,
	DEFAULT_THEME,
	Group,
	MantineSize,
	MantineSpacing,
	MantineThemeOverride,
	Paper,
	Stack,
	StyleProp,
	Switch,
	Tabs,
	Text,
	Tooltip,
	createTheme,
	mergeThemeOverrides,
} from "@mantine/core";
import {AppShellSize} from "@mantine/core/lib/components/AppShell/AppShell.types";

/**
 * Helper function for defining CSS variables for the AppBuilderAppShellTemplate
 * @param size
 * @param breakpoint
 * @param defval
 * @returns
 */
const getAppShellSize = (
	size: AppShellResponsiveSize | AppShellSize,
	breakpoint: MantineSize | "base",
	defval: string,
): string => {
	if (!size) return defval;

	if (typeof size === "object") {
		switch (breakpoint) {
			case "base":
				return "" + (size.base ?? defval);
			case "xs":
				return "" + (size.xs ?? size.base ?? defval);
			case "sm":
				return "" + (size.sm ?? size.xs ?? size.base ?? defval);
			case "md":
				return (
					"" + (size.md ?? size.sm ?? size.xs ?? size.base ?? defval)
				);
			case "lg":
				return (
					"" +
					(size.lg ??
						size.md ??
						size.sm ??
						size.xs ??
						size.base ??
						defval)
				);
			case "xl":
				return (
					"" +
					(size.xl ??
						size.lg ??
						size.md ??
						size.sm ??
						size.xs ??
						size.base ??
						defval)
				);
		}
	}

	return "" + size;
};

interface Props {
	/**
	 * Global theme overrides to be applied to the theme (theme overrides specific to the application).
	 */
	globalThemeOverrides?: MantineThemeOverride;
}

/**
 * Hook for getting our custom theme.
 * Theme overrides can be set in a global store using the hook useThemeOverrideStore.
 * @returns
 */
export const useCustomTheme = (props: Props = {}) => {
	const {globalThemeOverrides = {}} = props;

	/**
	 * Padding value used in various places.
	 * Note that there is no need to use this global value, this is
	 * just used for convenience. In case you need different paddings,
	 * feel free to set individual values.
	 */
	const padding: StyleProp<MantineSpacing> = "xs";

	/**
	 * Mantine theme object: @see https://mantine.dev/theming/theme-object/
	 * The theme can be used to set global default properties, and
	 * properties of individual components.
	 *
	 * Default properties for Mantine components and custom components:
	 * @see https://mantine.dev/theming/default-props/
	 *
	 * Mantine components: See the Mantine documentation for available properties.
	 *
	 * Custom components: See their implementation for available properties.
	 */
	const defaultTheme = createTheme({
		defaultRadius: "md",
		other: {
			//forceColorScheme: "light",
			defaultFontWeightThin: "100",
			defaultFontWeightLight: "300",
			defaultFontWeight: "400",
			defaultFontWeightMedium: "500",
			defaultFontWeightBold: "700",
		},
		components: {
			/**
			 * Default properties of Mantine components
			 */

			/**
			 * Accordion
			 * @see https://mantine.dev/core/accordion/?t=props
			 */
			Accordion: Accordion.extend({
				defaultProps: {
					variant: "contained",
				},
				styles: {
					content: {padding: "0"},
				},
			}),
			/**
			 * Accordion
			 * @see https://mantine.dev/core/accordion/?t=props
			 */
			AccordionPanel: Accordion.Panel.extend({
				defaultProps: {
					pl: padding,
					pr: padding,
					pb: padding,
				},
			}),
			/**
			 * Anchor
			 * @see https://mantine.dev/core/anchor/
			 */
			Anchor: Anchor.extend({
				defaultProps: {
					// underline: "hover",
					// c: "inherit",
				},
			}),
			/**
			 * Button
			 * @see https://mantine.dev/core/button/?t=props
			 */
			Button: Button.extend({
				defaultProps: {
					variant: "default",
					// fw: "700",
				},
			}),
			/**
			 * CloseButton
			 * @see https://mantine.dev/core/close-button/?t=props
			 */
			CloseButton: CloseButton.extend({
				defaultProps: {
					size: "3rem",
				},
			}),
			/**
			 * ColorInput
			 * @see https://mantine.dev/core/color-input/?t=props
			 */
			ColorInput: ColorInput.extend({
				styles: {
					input: {cursor: "pointer"},
				},
			}),
			/**
			 * Group
			 * @see https://mantine.dev/core/group/?t=props
			 */
			Group: Group.extend({
				defaultProps: {
					gap: padding,
				},
			}),
			/**
			 * Paper
			 * @see https://mantine.dev/core/paper/?t=props
			 */
			Paper: Paper.extend({
				defaultProps: {
					px: padding,
					py: padding,
					//shadow: "xs",
					withBorder: true,
				},
			}),
			/**
			 * Stack
			 * @see https://mantine.dev/core/stack/?t=props
			 */
			Stack: Stack.extend({
				defaultProps: {
					gap: "xs",
				},
			}),
			/**
			 * Switch
			 * @see https://mantine.dev/core/switch/?t=props
			 */
			Switch: Switch.extend({
				defaultProps: {
					size: "md",
				},
				styles: {
					track: {cursor: "pointer"},
				},
			}),
			/**
			 * Tabs
			 * @see https://mantine.dev/core/tabs/?t=props
			 */
			Tabs: Tabs.extend({}),
			/**
			 * Tabs
			 * @see https://mantine.dev/core/tabs/?t=props
			 */
			TabsPanel: Tabs.Panel.extend({
				defaultProps: {
					pt: padding,
				},
			}),
			/**
			 * Text
			 * @see https://mantine.dev/core/text/?t=props
			 */
			Text: Text.extend({
				defaultProps: {
					//fw: "400"
					//size: "md"
				},
			}),
			/**
			 * Tooltip
			 * @see https://mantine.dev/core/tooltip/?t=props
			 */
			Tooltip: Tooltip.extend({
				defaultProps: {
					position: "bottom",
				},
			}),

			/**
			 * Below here - custom components implemented by ShapeDiver
			 */

			/**
			 * AppBuilderContainerWrapper
			 *
			 * Used for defining theme overrides per template and per AppBuilder container.
			 */
			AppBuilderContainerWrapper: AppBuilderContainerWrapperThemeProps({
				containerThemeOverrides: {
					/** Theme overrides for the "appshell" template. */
					appshell: {
						/** Theme overrides for the "top" container. */
						top: {
							components: {
								Anchor: Anchor.extend({
									defaultProps: {
										c: "inherit",
									},
								}),
								Paper: Paper.extend({
									defaultProps: {
										withBorder: false,
									},
								}),
								AppBuilderHorizontalContainer: {
									defaultProps: {
										justify: "left",
									},
								},
								AppBuilderImage: AppBuilderImageThemeProps({
									fit: "scale-down",
									withBorder: false,
								}),
								AppBuilderTextWidgetComponent:
									AppBuilderTextWidgetThemeProps({
										styles: {root: {overflow: "clip"}},
									}),
							},
						},
						/** Theme overrides for the "bottom" container. */
						bottom: {
							components: {
								Anchor: Anchor.extend({
									defaultProps: {
										c: "inherit",
									},
								}),
								AppBuilderTextWidgetComponent:
									AppBuilderTextWidgetThemeProps({
										styles: {root: {overflow: "auto"}},
									}),
							},
						},
					},
					/** Theme overrides for the "grid" template. */
					grid: {
						/** Theme overrides for the "top" container. */
						top: {
							components: {
								Anchor: Anchor.extend({
									defaultProps: {
										c: "inherit",
									},
								}),
								Paper: Paper.extend({
									defaultProps: {
										withBorder: false,
									},
								}),
								AppBuilderHorizontalContainer: {
									defaultProps: {
										justify: "left",
									},
								},
								AppBuilderImage: AppBuilderImageThemeProps({
									fit: "scale-down",
									withBorder: false,
								}),
								AppBuilderTextWidgetComponent:
									AppBuilderTextWidgetThemeProps({
										styles: {root: {overflow: "clip"}},
									}),
							},
						},
						/** Theme overrides for the "bottom" container. */
						bottom: {
							components: {
								Anchor: Anchor.extend({
									defaultProps: {
										c: "inherit",
									},
								}),
								AppBuilderTextWidgetComponent:
									AppBuilderTextWidgetThemeProps({
										styles: {root: {overflow: "auto"}},
									}),
							},
						},
					},
				},
			}),
			AppBuilderContainer: AppBuilderContainerThemeProps({
				// orientation: "unspecified"
			}),
			/**
			 * AppBuilderImage
			 *
			 * Used to display AppBuilder image widgets.
			 */
			AppBuilderImage: AppBuilderImageThemeProps({
				// radius: "md",
				// fit: "contain",
				withBorder: true,
				// mah: "100%",
				// maw: "100%",
			}),
			/**
			 * AppBuilderAppShellTemplatePage
			 *
			 * AppShell template for AppBuilder.
			 *
			 * based to some extent on the Mantine AppShell component
			 */
			AppBuilderAppShellTemplatePage:
				AppBuilderAppShellTemplatePageThemeProps({
					// headerHeight: "4em",
					// headerHeight: { base: "4em", md: "6em"},
					// navbarBreakpoint: "md",
					// navbarWidth: { md: 200, lg: 250 },
					// columns: 3, // responsive example: { base: 2, lg: 3 },
					// rows: 3, // responsive example: { base: 2, lg: 3 },
					// rightColumns: 1,
					// bottomRows: 1,
					// bottomFullWidth: false,
					// navbarBorder: true,
					// headerBorder: true,
					// rightBorder: true,
					// keepBottomInGrid: false,
				}),
			/**
			 * AppBuilderGridTemplatePage
			 *
			 * Grid layout template for AppBuilder.
			 */
			AppBuilderGridTemplatePage: AppBuilderGridTemplatePageThemeProps({
				// bgTop: "transparent",
				// bgLeft: "transparent",
				// bgRight: "transparent",
				// bgBottom: "transparent",
				// columns: 5,
				// rows: 4,
				// leftColumns: 1,
				// rightColumns: 1,
				// topRows: 1,
				// bottomRows: 1,
				// topFullWidth: false,
				// bottomFullWidth: false,
			}),
			/**
			 * AppBuilderHorizontalContainer
			 *
			 * Used for horizontal AppBuilder containers.
			 */
			AppBuilderHorizontalContainer:
				AppBuilderHorizontalContainerThemeProps({
					// w: "100%",
					// h: "100%",
					// justify: "center",
					// wrap: "nowrap",
					// p: "xs",
				}),
			/**
			 * AppBuilderTemplateSelector
			 *
			 * Used for selecting the AppBuilder template.
			 */
			AppBuilderTemplateSelector: AppBuilderTemplateSelectorThemeProps({
				// template: "appshell" // default
				// template: "grid"
				// showContainerButtons: true,
			}),
			/***
			 * AppBuilderTextWidgetComponent
			 *
			 * Used for text widgets in AppBuilder.
			 */
			AppBuilderTextWidgetComponent: AppBuilderTextWidgetThemeProps({
				// withBorder: false,
				// shadow: "xs",
				// styles: { root: { overflow: "auto" }}
			}),
			AppBuilderAgentWidgetComponent: AppBuilderAgentWidgetThemeProps({
				// systemPrompt: "Hi there",
				// parameterNamesToInclude: ["PARAM_NAME_1", "PARAM_NAME_2"],
				// parameterNamesToExclude: ["PARAM_NAME_1", "PARAM_NAME_2"],
				// authorContext: "",
				// debug: true,
				// maxHistory: 10,
				// model: "gpt-4o-mini",
				// openaiApiKey: "YOUR_OPENAPI_API_KEY",
				// langfuseSecretKey: "YOUR_LANGFUSE_SECRET_API_KEY",
				// langfusePublicKey: "YOUR_LANGFUSE_PUBLIC_API_KEY",
				// langfuseBaseUrl: "YOUR_LANGFUSEBASE_URL",
			}),
			/**
			 * AppBuilderVerticalContainer
			 *
			 * Used for vertical AppBuilder containers.
			 */
			AppBuilderVerticalContainer: AppBuilderVerticalContainerThemeProps({
				// p: "md",
			}),
			/**
			 * DefaultSession
			 *
			 * Default session to use in case none is defined.
			 */
			DefaultSession: DefaultSessionThemeProps({
				// see Props of useDefaultSessionDto
				// example: "AR Cube",
				// slug: "",
				// platformUrl: "",
				// id: "",
				// ticket: "",
				// modelViewUrl: "",
				// initialParameterValues: {},
				// acceptRejectMode: true
			}),
			/**
			 * ExportLabelComponent
			 *
			 * Defaults for export labels.
			 */
			ExportLabelComponent: ExportLabelComponentThemeProps({
				//fontWeight: "500",
			}),
			/**
			 * Icon
			 *
			 * Icon component used by AppBuilder.
			 */
			Icon: IconThemeProps({
				// size: "1.5rem",
				// stroke: 1,
			}),
			/**
			 * LoaderPage
			 *
			 * Loader page displayed by AppBuilder while loading.
			 *
			 * Note: Customizing the loader page using a settings json file is not supported,
			 * because the loader page is displayed before the settings json file is loaded.
			 */
			LoaderPage: LoaderPageThemeProps({
				// size: "lg",
				// type: "bars" //| "dots" | "oval"
			}),
			/**
			 * MarkdownWidgetComponent
			 *
			 * Used by AppBuilder for displaying markdown.
			 */
			MarkdownWidgetComponent: MarkdownWidgetComponentProps({
				// anchorTarget: "_blank",
				// boldFontWeight: "500",
				// strongFontWeight: "700",
				// setHeadingFontSize: false,
				// themeOverride: {},
			}),
			/**
			 * NotificationWrapper
			 *
			 * Global settings for notifications.
			 */
			NotificationWrapper: NotificationWrapperThemeProps({
				// successColor?: undefined,
				// warningColor: "yellow",
				// errorColor?: "red",
				// autoClose: 20000, // boolean | number
			}),
			/**
			 * ParametersAndExportsAccordionComponent
			 *
			 * Defaults for parameter and export widgets.
			 */
			ParametersAndExportsAccordionComponent:
				ParametersAndExportsAccordionComponentThemeProps({
					//avoidSingleComponentGroups: true,
					//mergeAccordions: false,
					//pbSlider: "md",
					//identifyGroupsById: false,
				}),
			/**
			 * ParameterColorComponent
			 *
			 * Defaults for parameter color components.
			 */
			ParameterColorComponent: ParameterColorComponentThemeProps({
				// colorFormat: "rgba", // or "hexa"
			}),
			/**
			 * ParameterLabelComponent
			 *
			 * Defaults for parameter labels.
			 */
			ParameterLabelComponent: ParameterLabelComponentThemeProps({
				//fontWeight: "500",
			}),
			/**
			 * ParameterSelectComponent
			 *
			 * Defaults and settings for selection (dropdown) components.
			 */
			ParameterSelectComponent: ParameterSelectComponentThemeProps({
				// componentSettings: { "Predefined positions": { type: "chipgroup" } },
			}),
			/**
			 * ParameterSliderComponent
			 *
			 * Defaults for sliders.
			 */
			ParameterSliderComponent: ParameterSliderComponentThemeProps({
				//sliderWidth: "60%",
				//numberWidth: "35%",
			}),
			/**
			 * SelectCarouselComponent
			 *
			 * Defaults for select carousel components.
			 */
			SelectCarouselComponent: SelectCarouselComponentThemeProps({
				//slideSize: {base: "100%", "200px": "50%", "500px": "33.333333%"},
				//slideGap: {base: 0, "200px": "md"},
				// height: "auto",
			}),
			/**
			 * TooltipWrapper
			 *
			 * Global settings for tooltips.
			 */
			TooltipWrapper: TooltipWrapperThemeProps({
				//withArrow: true,
				//multiline: false,
				//w: 250,
				//floating: false,
				themeOverride: {
					fontSizes: {
						xs: "0.75rem",
						sm: "0.75rem",
						md: "0.875rem",
						lg: "1rem",
						xl: "1.125rem",
					},
					headings: {
						sizes: {
							h1: {fontSize: "1.125rem"},
							h2: {fontSize: "1rem"},
							h3: {fontSize: "0.875rem"},
							h4: {fontSize: "0.75rem"},
							h5: {fontSize: "0.625rem"},
							h6: {fontSize: "0.5rem"},
						},
					},
					// components: {
					// 	MarkdownWidgetComponent: MarkdownWidgetComponentProps({
					// 		setHeadingFontSize: true,
					// 	}),
					// 	List: List.extend({
					// 		defaultProps: {
					// 			size: "sm",
					// 		},
					// 	}),
					// 	Text: Text.extend({
					// 		defaultProps: {
					// 			size: "sm",
					// 		},
					// 	}),
					// },
				},
			}),
			/**
			 * ViewportBranding
			 *
			 * Define viewport branding for dark and light color scheme.
			 */
			ViewportBranding: ViewportBrandingThemeProps({
				light: {
					backgroundColor: DEFAULT_THEME.colors.gray[0],
					logo: "https://viewer.shapediver.com/v3/graphics/logo_animated_breath_inverted.svg",
				},
				dark: {
					backgroundColor: DEFAULT_THEME.colors.dark[8],
					logo: undefined,
				},
			}),
			/**
			 * ViewportAcceptRejectButtons
			 *
			 * Defaults for the viewport accept reject buttons.
			 */
			ViewportAcceptRejectButtons:
				ViewportAcceptRejectButtonsComponentThemeProps({
					// groupProps: {
					// 	justify: "center",
					// 	w: "auto",
					// 	wrap: "nowrap",
					// 	p: "xs",
					// },
					// buttonProps: {
					// 	variant: "light",
					// },
					// iconProps: {},
					// textProps: {size: "md"},
				}),
			/**
			 * ViewportComponent
			 *
			 * Default settings for the viewport component.
			 */
			ViewportComponent: ViewportComponentThemeProps({
				// sessionSettingsMode: SESSION_SETTINGS_MODE.FIRST,
				// showStatistics: true,
			}),
			/**
			 * ViewportIcons
			 *
			 * Which viewport icons to display.
			 */
			ViewportIcons: ViewportIconsThemeProps({
				// color: "black",
				// colorDisabled: "grey",
				// enableArBtn: false,
				// enableCamerasBtn: false,
				// enableFullscreenBtn: false,
				// enableZoomBtn: false,
				// fullscreenId: "viewer-fullscreen-area",
				// iconStyle: { m: "3px" },
				// size: 32,
				// style: { display: "flex"},
				// variant: "subtle",
				// variantDisabled: "transparent",
			}),
			/**
			 * ViewportOverlayWrapper
			 *
			 * Where to position viewport icons and other overlays.
			 */
			ViewportOverlayWrapper: ViewportOverlayWrapperThemeProps({
				// position: "bottom-right" // "top-left" | "top-right" | "bottom-left" | "bottom-right"
			}),
		},
	});

	const themeOverride = useThemeOverrideStore((state) => state.themeOverride);
	const theme = mergeThemeOverrides(
		defaultTheme,
		globalThemeOverrides,
		themeOverride,
	);
	console.debug("Theme", theme);

	/**
	 * @see https://mantine.dev/styles/css-variables/#css-variables-resolver
	 */
	const resolver: CSSVariablesResolver = (theme) => ({
		variables: {
			/** CSS variables used by the AppBuilderAppShellTemplate */
			"--appbuilder-appshelltemplate-headerheight-base": getAppShellSize(
				theme.components.AppBuilderAppShellTemplatePage.defaultProps
					.headerHeight,
				"base",
				"4em",
			),
			"--appbuilder-appshelltemplate-headerheight-xs": getAppShellSize(
				theme.components.AppBuilderAppShellTemplatePage.defaultProps
					.headerHeight,
				"xs",
				"4em",
			),
			"--appbuilder-appshelltemplate-headerheight-sm": getAppShellSize(
				theme.components.AppBuilderAppShellTemplatePage.defaultProps
					.headerHeight,
				"sm",
				"4em",
			),
			"--appbuilder-appshelltemplate-headerheight-md": getAppShellSize(
				theme.components.AppBuilderAppShellTemplatePage.defaultProps
					.headerHeight,
				"md",
				"4em",
			),
			"--appbuilder-appshelltemplate-headerheight-lg": getAppShellSize(
				theme.components.AppBuilderAppShellTemplatePage.defaultProps
					.headerHeight,
				"lg",
				"4em",
			),
			"--appbuilder-appshelltemplate-headerheight-xl": getAppShellSize(
				theme.components.AppBuilderAppShellTemplatePage.defaultProps
					.headerHeight,
				"xl",
				"4em",
			),
			"--appbuilder-default-font-weight-thin":
				theme.other.defaultFontWeightThin,
			"--appbuilder-default-font-weight-light":
				theme.other.defaultFontWeightLight,
			"--appbuilder-default-font-weight": theme.other.defaultFontWeight,
			"--appbuilder-default-font-weight-medium":
				theme.other.defaultFontWeightMedium,
			"--appbuilder-default-font-weight-bold":
				theme.other.defaultFontWeightBold,
		},
		light: {
			// variables for light theme
		},
		dark: {
			// variables for dark theme
		},
	});

	return {
		theme,
		resolver,
	};
};
