import {AppBuilderActionComponentThemeProps} from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import {AppBuilderImageThemeProps} from "@AppBuilderShared/components/shapediver/appbuilder/AppBuilderImage";
import {AppBuilderAccordionWidgetComponentThemeProps} from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderAccordionWidgetComponent";
import {AppBuilderAreaChartWidgetComponentThemeProps} from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderAreaChartWidgetComponent";
import {AppBuilderLineChartWidgetComponentThemeProps} from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderLineChartWidgetComponent";
import {AppBuilderRoundChartWidgetComponentThemeProps} from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderRoundChartWidgetComponent";
import {AppBuilderTextWidgetThemeProps} from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderTextWidgetComponent";
import {NumberAttributeThemeProps} from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/NumberAttribute";
import {StringAttributeThemeProps} from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/StringAttribute";
import {ExportLabelComponentThemeProps} from "@AppBuilderShared/components/shapediver/exports/ExportLabelComponent";
import {OutputChunkLabelComponentThemeProps} from "@AppBuilderShared/components/shapediver/outputs/OutputChunkLabelComponent";
import {OutputStargateComponentThemeProps} from "@AppBuilderShared/components/shapediver/outputs/OutputStargateComponent";
import {ParameterColorComponentThemeProps} from "@AppBuilderShared/components/shapediver/parameter/ParameterColorComponent";
import {ParameterLabelComponentThemeProps} from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import {ParameterSelectComponentThemeProps} from "@AppBuilderShared/components/shapediver/parameter/ParameterSelectComponent";
import {ParameterSliderComponentThemeProps} from "@AppBuilderShared/components/shapediver/parameter/ParameterSliderComponent";
import {ParameterStargateComponentThemeProps} from "@AppBuilderShared/components/shapediver/parameter/ParameterStargateComponent";
import {SelectCarouselComponentThemeProps} from "@AppBuilderShared/components/shapediver/parameter/select/SelectCarouselComponent";
import {SelectGridComponentThemeProps} from "@AppBuilderShared/components/shapediver/parameter/select/SelectGridComponent";
import {DesktopClientPanelThemeProps} from "@AppBuilderShared/components/shapediver/stargate/DesktopClientPanel";
import {StargateInputThemeProps} from "@AppBuilderShared/components/shapediver/stargate/StargateInput";
import {StargateSharedThemeProps} from "@AppBuilderShared/components/shapediver/stargate/stargateShared";
import {MarkdownWidgetComponentProps} from "@AppBuilderShared/components/shapediver/ui/MarkdownWidgetComponent";
import {ParametersAndExportsAccordionComponentThemeProps} from "@AppBuilderShared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import {ViewportAcceptRejectButtonsComponentThemeProps} from "@AppBuilderShared/components/shapediver/ui/ViewportAcceptRejectButtons";
import {IconThemeProps} from "@AppBuilderShared/components/ui/Icon";
import {ModalBaseThemeProps} from "@AppBuilderShared/components/ui/ModalBase";
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
import {ExportButtonComponentThemeProps} from "~/shared/components/shapediver/exports/ExportButtonComponent";
import {HintProps} from "~/shared/components/ui/Hint";
import {AppBuilderAgentWidgetThemeProps} from "~/shared/types/components/shapediver/props/appBuilderAgentWidget";
import {CreateModelStateHookThemeProps} from "../shapediver/useCreateModelState";

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
				// 	type: IconTypeEnum.Refresh,
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
				// 	type: IconTypeEnum.IconInfoCircleFilled,
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
			NumberAttribute: NumberAttributeThemeProps({}),
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
				//	type: IconTypeEnum.Cancel,
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
			StringAttribute: StringAttributeThemeProps({}),
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
					// 	variant: "default",
					// 	style: {
					// 		boxShadow: "var(--mantine-shadow-md)",
					// 		backgroundColor: alpha("var(--mantine-color-body)", 0.5),
					// 		backdropFilter: "blur(10px)",
					// 		border: "none",
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
				// enableZoomBtn: true,
				// enableHistoryMenuButton: true,
				// color: undefined,
				// colorDisabled: undefined,
				// variant: "subtle",
				// variantDisabled: "transparent",
				// size: 32,
				// iconStyle: { m: "0.188rem" },
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
