import {DesktopClientPanelThemeProps} from "@AppBuilderLib/entities/stargate/ui/DesktopClientPanel";
import {StargateInputThemeProps} from "@AppBuilderLib/entities/stargate/ui/StargateInput";
import {StargateSharedThemeProps} from "@AppBuilderLib/entities/stargate/ui/stargateShared";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {IconThemeProps} from "@AppBuilderLib/shared/ui/icon";
import {TooltipWrapperThemeProps} from "@AppBuilderLib/shared/ui/tooltip";
import {AppBuilderActionComponentThemeProps} from "@AppBuilderLib/features/appbuilder/ui/AppBuilderActionComponent";
import {AppBuilderImageThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderImage";
import {AppBuilderAccordionUiWidgetComponentThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderAccordionUiWidgetComponent";
import {AppBuilderAccordionWidgetComponentThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderAccordionWidgetComponent";
import {AppBuilderAreaChartWidgetComponentThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderAreaChartWidgetComponent";
import {AppBuilderControlsWidgetComponentThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderControlsWidgetComponent";
import {AppBuilderFormWidgetComponentThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderFormWidgetComponent";
import {AppBuilderLineChartWidgetComponentThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderLineChartWidgetComponent";
import {AppBuilderRoundChartWidgetComponentThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderRoundChartWidgetComponent";
import {AppBuilderSavedStatesWidgetComponentThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderSavedStatesWidgetComponent";
import {AppBuilderTextWidgetThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderTextWidgetComponent";
import {ExportButtonComponentThemeProps} from "@AppBuilderLib/entities/export/ui/ExportButtonComponent";
import {ExportLabelComponentThemeProps} from "@AppBuilderLib/entities/export/ui/ExportLabelComponent";
import {OutputChunkLabelComponentThemeProps} from "@AppBuilderLib/entities/output/ui/OutputChunkLabelComponent";
import {OutputStargateComponentThemeProps} from "@AppBuilderLib/entities/output/ui/OutputStargateComponent";
import {ParameterColorComponentThemeProps} from "@AppBuilderLib/entities/parameter/ui/ParameterColorComponent";
import {ParameterLabelComponentThemeProps} from "@AppBuilderLib/entities/parameter/ui/ParameterLabelComponent";
import {ParameterSelectComponentThemeProps} from "@AppBuilderLib/entities/parameter/ui/ParameterSelectComponent";
import {ParameterSliderComponentThemeProps} from "@AppBuilderLib/entities/parameter/ui/ParameterSliderComponent";
import {ParameterStargateComponentThemeProps} from "@AppBuilderLib/entities/parameter/ui/ParameterStargateComponent";
import {SelectCarouselComponentThemeProps} from "@AppBuilderLib/entities/parameter/ui/select/SelectCarouselComponent";
import {SelectFullWidthCardsComponentThemeProps} from "@AppBuilderLib/entities/parameter/ui/select/SelectFullWidthCards";
import {SelectGridComponentThemeProps} from "@AppBuilderLib/entities/parameter/ui/select/SelectGridComponent";
import {MarkdownWidgetComponentProps} from "@AppBuilderLib/shared/ui/markdown/MarkdownWidgetComponent";
import {ParametersAndExportsAccordionComponentThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/ParametersAndExportsAccordionComponent";
import {ViewportAcceptRejectButtonsComponentThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/ViewportAcceptRejectButtons";
import {ViewportIconButtonThemeProps} from "@AppBuilderLib/entities/viewport/ui/ViewportIconButton";
import {ViewportIconButtonDropdownThemeProps} from "@AppBuilderLib/entities/viewport/ui/ViewportIconButtonDropdown";
import {HintProps} from "@AppBuilderLib/shared/ui/hint/Hint";
import {ModalBaseThemeProps} from "@AppBuilderLib/shared/ui/modal/ModalBase";
import {NotificationWrapperThemeProps} from "@AppBuilderLib/features/notifications/ui/NotificationWrapper";
import {DefaultSessionThemeProps} from "@AppBuilderLib/entities/session/model/useDefaultSessionDto";
import {LoaderPageThemeProps} from "@AppBuilderShared/pages/misc/LoaderPage";
import {AppBuilderAppShellTemplatePageThemeProps} from "@AppBuilderShared/pages/templates/AppBuilderAppShellTemplatePage";
import {AppBuilderContainerThemeProps} from "@AppBuilderShared/pages/templates/AppBuilderContainer";
import {AppBuilderContainerWrapperThemeProps} from "@AppBuilderShared/pages/templates/AppBuilderContainerWrapper";
import {AppBuilderGridTemplatePageThemeProps} from "@AppBuilderShared/pages/templates/AppBuilderGridTemplatePage";
import {AppBuilderHorizontalContainerThemeProps} from "@AppBuilderShared/pages/templates/AppBuilderHorizontalContainer";
import {AppBuilderTemplateSelectorThemeProps} from "@AppBuilderShared/pages/templates/AppBuilderTemplateSelector";
import {AppBuilderVerticalContainerThemeProps} from "@AppBuilderShared/pages/templates/AppBuilderVerticalContainer";
import {useThemeOverrideStore} from "@AppBuilderLib/shared/model/useThemeOverrideStore";
import {AppBuilderAgentWidgetThemeProps} from "@AppBuilderLib/widgets/appbuilder/config/appBuilderAgentWidget";
import {AppBuilderContainerNameType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	ViewportBrandingThemeProps,
	ViewportComponentThemeProps,
} from "@AppBuilderLib/entities/viewport/config/viewport";
import {ViewportIconsThemeProps} from "@AppBuilderLib/entities/viewport/config/viewportIcons";
import {ViewportOverlayWrapperThemeProps} from "@AppBuilderLib/entities/viewport/config/viewportOverlayWrapper";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {
	AreaChart,
	BarChart,
	DonutChart,
	LineChart,
	PieChart,
} from "@mantine/charts";
import {
	Accordion,
	Anchor,
	AppShellResponsiveSize,
	Badge,
	Button,
	CSSVariablesResolver,
	CloseButton,
	ColorInput,
	DEFAULT_THEME,
	Group,
	Image,
	MantineSize,
	MantineSpacing,
	MantineThemeOverride,
	Paper,
	RangeSlider,
	Stack,
	StyleProp,
	Switch,
	Tabs,
	Text,
	Title,
	Tooltip,
	createTheme,
	mergeThemeOverrides,
} from "@mantine/core";
import {AppShellSize} from "@mantine/core/lib/components/AppShell/AppShell.types";
import {useContext} from "react";
import {AppBuilderStackUiWidgetComponentThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderStackUiWidget/AppBuilderStackUiWidgetComponent";
import {MultiSelectCheckboxesProps} from "@AppBuilderLib/entities/parameter/ui/multiselect/MultiSelectCheckboxesComponent";
import {CreateModelStateHookThemeProps} from "@AppBuilderLib/features/model-state/model/useCreateModelState";

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

	const componentContext = useContext(ComponentContext);

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
		shadows: {
			xs: "0 1px 2px rgba(0, 0, 0, 0.1)",
			sm: "0 1px 3px rgba(0, 0, 0, 0.1)",
			md: "0 2px 4px rgba(0, 0, 0, 0.1)",
			lg: "0 4px 8px rgba(0, 0, 0, 0.1)",
			xl: "0 8px 16px rgba(0, 0, 0, 0.1)",
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
					// By default the Accordion items use a background color of var(--item-filled-color).
					// This can be changed by overriding the backgroundColor property as shown below.
					//item: {backgroundColor: "var(--item-filled-color)"},
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
			 * AreaChart
			 * @see https://mantine.dev/charts/area-chart/?t=props
			 */
			AreaChart: AreaChart.extend({
				defaultProps: {},
			}),
			/**
			 * Badge
			 * @see https://mantine.dev/core/badge/?t=props
			 */
			Badge: Badge.extend({
				defaultProps: {},
			}),
			/**
			 * BarChart
			 * @see https://mantine.dev/charts/bar-chart/?t=props
			 */
			BarChart: BarChart.extend({
				defaultProps: {},
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
			 * DonutChart
			 * @see https://mantine.dev/charts/donut-chart/?t=props
			 */
			DonutChart: DonutChart.extend({}),
			Image: Image.extend({
				styles: {
					root: {
						flex: 0,
					},
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
			 * LineChart
			 * @see https://mantine.dev/charts/line-chart/?t=props
			 */
			LineChart: LineChart.extend({}),
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
			 * PieChart
			 * @see https://mantine.dev/charts/pie-chart/?t=props
			 */
			PieChart: PieChart.extend({}),
			/**
			 * RangeSlider
			 * @see https://mantine.dev/core/range-slider/?t=props
			 */
			RangeSlider: RangeSlider.extend({}),
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
			 * Title
			 * @see https://mantine.dev/core/title/?t=props
			 */
			Title: Title.extend({
				defaultProps: {
					order: 2, // default order
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
			 * AppBuilderAccordionWidgetComponent
			 *
			 * Used for defining theme overrides for accordion widgets.
			 */
			AppBuilderAccordionWidgetComponent:
				AppBuilderAccordionWidgetComponentThemeProps({
					// showAcceptRejectButtons: false,
				}),
			/**
			 * AppBuilderAccordionUiWidgetComponent
			 *
			 * Used for defining theme overrides for accordion ui widgets.
			 */
			AppBuilderAccordionUiWidgetComponent:
				AppBuilderAccordionUiWidgetComponentThemeProps({
					accordionProps: {
						// variant: "default",
					},
				}),
			/**
			 * AppBuilderActionComponent
			 *
			 * Used for defining theme overrides for action components.
			 */
			AppBuilderActionComponent: AppBuilderActionComponentThemeProps({
				// variant: "filled",
			}),
			/**
			 * AppBuilderAreaChartWidgetComponent
			 *
			 * Used for defining theme overrides for area chart widgets.
			 */
			AppBuilderAreaChartWidgetComponent:
				AppBuilderAreaChartWidgetComponentThemeProps({}),
			/**
			 * AppBuilderAgentWidgetComponent
			 *
			 * Used for defining theme overrides for agent widgets.
			 */
			AppBuilderAttributeVisualizationWidgetComponent:
				AppBuilderAccordionWidgetComponentThemeProps({}),
			/**
			 * AppBuilderBarChartWidgetComponent
			 *
			 * Used for defining theme overrides for bar chart widgets.
			 */
			AppBuilderBarChartWidgetComponent:
				AppBuilderAreaChartWidgetComponentThemeProps({}),
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
			/**
			 * AppBuilderControlsWidgetComponent
			 *
			 * Used for defining theme overrides for controls widgets.
			 */
			AppBuilderControlsWidgetComponent:
				AppBuilderControlsWidgetComponentThemeProps({
					// stackProps: {
					// },
					// elementPaperProps: {
					// 	shadow: "none",
					// },
				}),
			/**
			 * AppBuilderFormWidgetComponent
			 *
			 * Form widget with parameter controls, export submission, and message display.
			 * Supports form validation, parameter reset, and success/error message display.
			 * When submit="message", displays a reset button at top right to fill the form again.
			 */
			AppBuilderFormWidgetComponent:
				AppBuilderFormWidgetComponentThemeProps({
					// stackProps: {
					//   gap: 0,
					// },
					// formPaperProps: {
					//   withBorder: true,
					//   shadow: "none",
					//   p: 0,
					// },
					// elementPaperProps: {
					//   withBorder: false,
					//   shadow: "none",
					//   px: 0,
					//   pt: 0,
					//   pb: "sm",
					// },
					// exportPaperProps: {
					//   withBorder: false,
					//   shadow: "none",
					//   px: 0,
					//   py: 0,
					//   mt: "xs",
					// },
					// messagePaperProps: {
					//   shadow: "sm",
					//   p: "md",
					// },
					// resetButtonProps: {
					//   variant: "subtle",
					//   size: "sm",
					// },
					// resetMessage: "Reset form",
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
			 * AppBuilderLineChartWidgetComponent
			 *
			 * Used for defining theme overrides for line chart widgets.
			 */
			AppBuilderLineChartWidgetComponent:
				AppBuilderLineChartWidgetComponentThemeProps({}),
			/**
			 * AppBuilderRoundChartWidgetComponent
			 *
			 * Used for defining theme overrides for round chart widgets.
			 */
			AppBuilderRoundChartWidgetComponent:
				AppBuilderRoundChartWidgetComponentThemeProps({}),
			/**
			 * AppBuilderSavedStatesWidgetComponent
			 *
			 * Used for defining theme overrides for saved states widgets.
			 */
			AppBuilderSavedStatesWidgetComponent:
				AppBuilderSavedStatesWidgetComponentThemeProps({
					// selectProps: {
					// 	type: "fullwidthcards",
					// },
					// paperProps: {
					// 	p: "md",
					// },
					// stackProps: {
					// 	gap: "md",
					// },
					// loaderFlexProps: {
					// 	justify: "center",
					// 	align: "center",
					// },
					// loaderProps: {},
				}),
			/**
			 * AppBuilderStackUiWidgetComponent
			 *
			 * Used for defining theme overrides for stack ui widgets.
			 */
			AppBuilderStackUiWidgetComponent:
				AppBuilderStackUiWidgetComponentThemeProps({
					// stackPaperProps: {
					// 	px: 0,
					// 	py: 0,
					// 	withBorder: false,
					// 	shadow: "md",
					// 	style: {backgroundColor: "var(--mantine-color-gray-0)"},
					// },
					// stackProps: {gap: "xs"},
					// itemTextProps: {size: "md"},
					// buttonForwardProps: {
					// 	justify: "space-between",
					// 	fullWidth: true,
					// 	size: "lg",
					// 	px: "md",
					// 	variant: "default",
					// },
					// iconForwardProps: {
					// 	size: 18,
					// 	iconType: "tabler:chevron-right",
					// },
					// buttonBackProps: {
					// 	mt: "xs",
					// 	variant: "subtle",
					// },
					// iconBackProps: {
					// 	size: 18,
					// 	iconType: "tabler:chevron-left",
					// },
					// transitionBackProps: {
					// 	transition: "slide-right",
					// 	duration: 300,
					// 	timingFunction: "ease",
					// },
					// stackContentProps: {
					// 	pb: "xs",
					// 	px: "xs",
					// },
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
			 * CreateModelStateHook
			 *
			 * Hook for creating model states.
			 */
			CreateModelStateHook: CreateModelStateHookThemeProps({
				parameterNamesToAlwaysExclude: ["context"],
			}),
			/**
			 * ExportButton
			 *
			 * Button used for export components.
			 */
			ExportButtonComponent: ExportButtonComponentThemeProps({
				// buttonProps: {
				// 	variant: "light",
				//  fullWidth: true,
				// },
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
			 * DesktopClientPanel
			 *
			 * Used for displaying the desktop client panel.
			 */
			DesktopClientPanel: DesktopClientPanelThemeProps({
				// iconStatusProps: {
				// 	variant: "subtle",
				// 	mb: 4,
				// },
				// alertProps: {
				// 	title: "Desktop Clients",
				// },
				// alertTextProps: {
				// 	size: "sm",
				// },
				// paperProps: {
				// 	p: "md",
				// 	withBorder: true,
				// },
				// stackProps: {
				// 	gap: "md",
				// },
				// groupTopProps: {
				// 	justify: "space-between",
				// 	align: "center",
				// },
				// textProps: {
				// 	fw: 500,
				// 	size: "sm",
				// },
				// actionIconRefreshProps: {
				// 	variant: "subtle",
				// 	loaderProps: {type: "dots"},
				// },
				// iconRefreshProps: {
				// 	iconType: IconRefresh,
				// 	size: "1rem",
				// },
				// groupBottomProps: {
				// 	justify: "space-between",
				// 	align: "end",
				// },
				// selectProps: {
				// 	style: {flex: 1},
				// 	label: "Clients",
				// 	placeholder: "Select a client",
				// },
				// loaderProps: {
				// 	type: "dots",
				// 	size: "xs",
				// },
				// statusIconProps: {
				// 	size: "1.2rem",
				// },
				// clientsFilter: [],
				// autoConnect: true,
			}),
			SelectFullWidthCardsComponent:
				SelectFullWidthCardsComponentThemeProps({
					// height: "300px",
					// searchable: true,
					// limit: 5,
				}),
			/**
			 * ExportLabelComponent
			 *
			 * Defaults for export labels.
			 */
			ExportLabelComponent: ExportLabelComponentThemeProps({
				//fontWeight: "medium",
			}),
			/**
			 * HintComponent
			 *
			 * Hint component that displays information
			 * with a link to documentation.
			 */
			Hint: HintProps({
				// buttonProps: {
				// 	variant: "light",
				// 	size: "xs",
				// 	component: "a",
				// 	target: "_blank",
				// 	rel: "noopener noreferrer",
				// },
				// containerGroupProps: {
				// 	justify: "space-between",
				// 	gap: "sm",
				// 	p: "md",
				// 	style: {
				// 		backgroundColor: "var(--mantine-primary-color-light)",
				// 		borderRadius: "var(--mantine-radius-md)",
				// 		borderLeft: "10px solid var(--mantine-primary-color-filled)",
				// 	},
				// },
				// groupProps: {
				// 	gap: "sm",
				// },
				// iconProps: {
				// 	iconType: IconInfoCircleFilled,
				// 	color: "var(--mantine-primary-color-filled)",
				// },
				// textProps: {
				// 	size: "sm",
				// 	fw: 500,
				// 	c: "var(--mantine-primary-color-filled)",
				// },
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
			 * ModalBase
			 *
			 * ModalBase component for dialogs and overlays.
			 */
			ModalBase: ModalBaseThemeProps({
				// size: "xl",
				// centered: true,
				// closeButtonProps: {
				// 	size: "md",
				// },
				// stackGap: "sm",
				// groupGap: "sm",
				// buttonContainerProps: {
				// 	justify: "space-between",
				// 	align: "center",
				// },
				// cancelButtonProps: {
				// 	variant: "default",
				// },
				// confirmButtonProps: {
				// 	variant: "filled",
				// },
			}),
			/**
			 * MultiSelectCheckboxes
			 *
			 * Defaults for multi select checkboxes.
			 */
			MultiSelectCheckboxes: MultiSelectCheckboxesProps({
				// stackProps: {
				// 	gap: "xs",
				// },
				// checkboxProps: {
				// 	ml: "md",
				// },
				// checkboxPropsSelectAll: {
				// 	label: "Select all",
				// },
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
			 * NumberAttribute
			 *
			 * Defaults for number attributes.
			 */
			NumberAttribute:
				componentContext.widgets?.attributeVisualization.themeProps?.NumberAttribute(
					{},
				),
			/**
			 * OutputChunkLabelComponent
			 *
			 * Defaults for output chunk labels.
			 */
			OutputChunkLabelComponent: OutputChunkLabelComponentThemeProps({
				//fontWeight: "medium",
			}),
			OutputStargateComponent: OutputStargateComponentThemeProps({
				// stackProps: {
				// 	pb: "xs",
				// },
			}),
			/**
			 * ParametersAndExportsAccordionComponent
			 *
			 * Defaults for parameter and export widgets.
			 */
			ParametersAndExportsAccordionComponent:
				ParametersAndExportsAccordionComponentThemeProps({
					//defaultGroupName: "Default",
					//avoidSingleComponentGroups: true,
					//mergeAccordions: false,
					//pbSlider: "md",
					//identifyGroupsById: false,
					//accordionPaperProps: {px: 0, py: 0, withBorder: false /*, shadow: "md"*/}
					// see ParametersAndExportsAccordionComponent for more style properties
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
				//fontWeight: "medium",
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
			ParameterStargateComponent: ParameterStargateComponentThemeProps({
				//parameterWrapperProps: defaultPropsParameterWrapper,
				//tooltipProps: {
				//	position: "left",
				//	label: "Clear selection",
				//},
				//actionIconProps: {
				//	size: "lg",
				//	variant: "transparent",
				//	loaderProps: {
				//		type: "dots",
				//	},
				//},
				//iconProps: {
				//	iconType: IconCancel,
				//	size: "1.2rem",
				//  color: "var(--mantine-color-default-color)",
				//},
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
			 * SelectGridComponent
			 *
			 * Defaults for select grid components.
			 */
			SelectGridComponent: SelectGridComponentThemeProps({
				//gridProps: { cols: 2, spacing: "md" },
				//showLabel: true,
				// height: "300px",
				// searchable: true,
				// limit: 5,
			}),
			StargateInput: StargateInputThemeProps({
				// buttonProps: {
				// 	variant: "filled",
				// 	fullWidth: true,
				// 	justify: "space-between",
				// },
				// loadingButtonProps: {
				// 	disabled: true,
				// 	fullWidth: true,
				// 	justify: "space-between",
				// 	style: {
				// 		backgroundColor: "transparent",
				// 	},
				// },
				// textProps: {
				// 	size: "sm",
				// 	c: "dimmed",
				// 	fs: "italic",
				// },
				// loaderProps: {
				// 	type: "dots",
				// 	size: "sm",
				// },
			}),
			StargateShared: StargateSharedThemeProps({
				// stargateColorProps: {
				// 	primary: "var(--mantine-primary-color-filled)",
				// 	focused: "var(--mantine-color-orange-7)",
				// 	dimmed: "var(--mantine-color-gray-2)",
				// },
			}),
			/**
			 * StringAttribute
			 *
			 * Defaults for string attributes.
			 */
			StringAttribute:
				componentContext.widgets?.attributeVisualization.themeProps?.StringAttribute(
					{},
				),
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
			 * ViewportAnchor2d
			 *
			 *
			 */
			ViewportAnchor2d: componentContext.viewportAnchors?.[
				AppBuilderContainerNameType.Anchor2d
			].themeProps({
				// anchorPaperProps: {
				// 	style: {
				// 		...defaultStyleProps.style,
				// 	},
				// 	pt: 0,
				// 	shadow: "md",
				// },
				// anchorStackProps: {
				// 	style: {
				// 		// the only other styling I added is the border radius
				// 		// as otherwise this looks really bad
				// 		borderRadius: "var(--mantine-radius-md)",
				// 	},
				// },
				// mobileBreakpoint: "sm",
				// previewIconProps: {
				// 	paperStyleProps: ViewportIconsDefaultStyleProps.style,
				// 	paperProps: ViewportIconsDefaultStyleProps.paperProps,
				// 	iconProps: ViewportIconButtonDefaultStyleProps.iconProps,
				// 	actionIconProps:
				// 		ViewportIconButtonDefaultStyleProps.actionIconProps,
				// },
			}),

			/**
			 * ViewportAnchor3d
			 *
			 *
			 */
			ViewportAnchor3d: componentContext.viewportAnchors?.[
				AppBuilderContainerNameType.Anchor3d
			].themeProps({
				// anchorPaperProps: {
				// 	style: {
				// 		...defaultStyleProps.style,
				// 	},
				// 	pt: 0,
				// 	shadow: "md",
				// },
				// anchorStackProps: {
				// 	style: {
				// 		// the only other styling I added is the border radius
				// 		// as otherwise this looks really bad
				// 		borderRadius: "var(--mantine-radius-md)",
				// 	},
				// },
				// mobileBreakpoint: "sm",
				// previewIconProps: {
				// 	paperStyleProps: ViewportIconsDefaultStyleProps.style,
				// 	paperProps: ViewportIconsDefaultStyleProps.paperProps,
				// 	iconProps: ViewportIconButtonDefaultStyleProps.iconProps,
				// 	actionIconProps:
				// 		ViewportIconButtonDefaultStyleProps.actionIconProps,
				// },
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
					// 	variant: "default",
					// },
					// acceptButtonProps: {
					// 	style: {
					// 		...ViewportTransparentBackgroundStyle,
					// 		boxShadow: "var(--mantine-shadow-md)",
					// 		border: "none",
					// 		backgroundColor: alpha(
					// 			"var(--mantine-primary-color-filled)",
					// 			0.5,
					// 		),
					// 	},
					// },
					// rejectButtonProps: {
					// 	style: {
					// 		...ViewportTransparentBackgroundStyle,
					// 		boxShadow: "var(--mantine-shadow-md)",
					// 		border: "none",
					// 		backgroundColor: alpha(
					// 			"var(--mantine-color-red-filled)",
					// 			0.5,
					// 		),
					// 	},
					// },
					// iconProps: {},
					// textProps: {size: "md"},
					// showButtons: undefined,
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
				// style: {
				//  border: "none",
				// 	display: "flex",
				// 	gap: "0.25rem",
				// 	alignItems: "center",
				// 	flexDirection: "row",
				// },
				// fullscreenId: "viewer-fullscreen-area",
				// enableHistoryButtons: true,
				// enableModelStateButtons: true,
				// enableImportExportButtons: true,
				// enableResetButton: true,
				// enableArBtn: true,
				// enableCamerasBtn: true,
				// enableFullscreenBtn: true,
				// enableFullscreenBtn3States: false,
				// enableZoomBtn: true,
				// enableHistoryMenuButton: true,
				// viewportOverlayProps: {
				// 	position: OverlayPosition.TOP_MIDDLE,
				// 	offset: "0.5em",
				// },
				// paperProps: {
				// 	py: 1,
				// 	px: 0,
				// 	shadow: "md",
				// },
				// dividerProps: {
				// 	orientation: "vertical",
				// 	color: "var(--mantine-color-dimmed)",
				// },
				// transitionProps: {
				// 	transition: "fade-down",
				// 	duration: 400,
				// 	timingFunction: "ease",
				//	keepMounted: true,
				// },
			}),
			ViewportIconButton: ViewportIconButtonThemeProps({
				// actionIconProps: {
				// 	size: 32,
				// 	variant: "subtle",
				// 	variantDisabled: "transparent",
				// 	style: {
				// 		m: "0.188rem",
				// 	},
				// },
				// iconProps: {
				// 	color: "var(--mantine-color-default-color)",
				// 	colorDisabled: "var(--mantine-color-disabled-color)",
				// },
			}),
			ViewportIconButtonDropdown: ViewportIconButtonDropdownThemeProps({
				// menuProps: {shadow: "md", position: "bottom-end"},
				// menuDropdownProps: {
				// 	style: {
				// 		backgroundColor:
				// 			"alpha(\"var(--mantine-color-body)\", 0.5)",
				// 		backdropFilter: "blur(10px)",
				// 	},
				// },
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
	Logger.debug("Theme", theme);

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
