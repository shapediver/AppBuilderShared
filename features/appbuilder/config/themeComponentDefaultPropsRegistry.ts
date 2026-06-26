import {ExportButtonComponentThemeDefaultPropsSchema} from "@AppBuilderLib/entities/export/config/ExportButtonComponent.theme.types";
import {OutputStargateComponentThemeDefaultPropsSchema} from "@AppBuilderLib/entities/output/config/OutputStargateComponent.theme.types";
import {MultiSelectCheckboxesThemeDefaultPropsSchema} from "@AppBuilderLib/entities/parameter/config/MultiSelectCheckboxes.theme.types";
import {ParameterLabelComponentThemeDefaultPropsSchema} from "@AppBuilderLib/entities/parameter/config/ParameterLabelComponent.theme.types";
import {ParameterRectangleTransformComponentThemeDefaultPropsSchema} from "@AppBuilderLib/entities/parameter/config/parameterRectangleTransformComponent.theme.types";
import {ParameterSelectComponentThemeDefaultPropsSchema} from "@AppBuilderLib/entities/parameter/config/ParameterSelectComponent.theme.types";
import {ParameterStargateComponentThemeDefaultPropsSchema} from "@AppBuilderLib/entities/parameter/config/ParameterStargateComponent.theme.types";
import {SelectCarouselComponentThemeDefaultPropsSchema} from "@AppBuilderLib/entities/parameter/config/SelectCarouselComponent.theme.types";
import {SelectFullWidthCardsComponentThemeDefaultPropsSchema} from "@AppBuilderLib/entities/parameter/config/SelectFullWidthCardsComponent.theme.types";
import {SelectGridComponentThemeDefaultPropsSchema} from "@AppBuilderLib/entities/parameter/config/SelectGridComponent.theme.types";
import {ParameterSliderComponentThemeDefaultPropsSchema} from "@AppBuilderLib/entities/parameter/ui/ParameterSliderComponent.types";
import {DefaultSessionThemeDefaultPropsSchema} from "@AppBuilderLib/entities/session/config/DefaultSession.theme.types";
import {DesktopClientPanelThemeDefaultPropsSchema} from "@AppBuilderLib/entities/stargate/config/DesktopClientPanel.theme.types";
import {StargateInputThemeDefaultPropsSchema} from "@AppBuilderLib/entities/stargate/config/StargateInput.theme.types";
import {StargateSharedThemeDefaultPropsSchema} from "@AppBuilderLib/entities/stargate/ui/stargateShared";
import {ViewportBrandingThemeDefaultPropsSchema} from "@AppBuilderLib/entities/viewport/config/ViewportBranding.theme.types";
import {ViewportComponentThemeDefaultPropsSchema} from "@AppBuilderLib/entities/viewport/config/ViewportComponent.theme.types";
import {ViewportIconButtonThemeDefaultPropsSchema} from "@AppBuilderLib/entities/viewport/config/ViewportIconButton.theme.types";
import {ViewportIconButtonDropdownThemeDefaultPropsSchema} from "@AppBuilderLib/entities/viewport/config/ViewportIconButtonDropdown.theme.types";
import {ViewportIconsThemeDefaultPropsSchema} from "@AppBuilderLib/entities/viewport/config/ViewportIcons.theme.types";
import {ViewportOverlayWrapperThemeDefaultPropsSchema} from "@AppBuilderLib/entities/viewport/config/ViewportOverlayWrapper.theme.types";
import {AppBuilderActionComponentThemeDefaultPropsSchema} from "@AppBuilderLib/features/appbuilder/config/AppBuilderActionComponent.theme.types";
import {CreateModelStateHookThemeDefaultPropsSchema} from "@AppBuilderLib/features/model-state/model/useCreateModelState.types";
import {NotificationWrapperThemeDefaultPropsSchema} from "@AppBuilderLib/features/notifications/config/notificationcontext";
import {AppBuilderContainerWrapperThemeDefaultPropsSchema} from "@AppBuilderLib/pages/config/AppBuilderContainerWrapper.theme.types";
import {LoaderPageThemeDefaultPropsSchema} from "@AppBuilderLib/pages/misc/LoaderPage.types";
import {AppBuilderAppShellTemplatePageThemeDefaultPropsSchema} from "@AppBuilderLib/pages/templates/AppBuilderAppShellTemplatePage.theme.types";
import {AppBuilderGridTemplatePageThemeDefaultPropsSchema} from "@AppBuilderLib/pages/templates/AppBuilderGridTemplatePage.theme.types";
import {mantineAccordionPropsSchema} from "@AppBuilderLib/shared/mantine-props/accordion.zod";
import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineTextPropsSchema} from "@AppBuilderLib/shared/mantine-props/text.zod";
import {HintThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/hint/Hint.theme.types";
import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {MarkdownWidgetComponentThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/markdown/MarkdownWidgetComponent.theme.types";
import {ModalBaseThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/modal/ModalBase.theme.types";
import {TooltipWrapperThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/tooltip/TooltipWrapper.theme.types";
import {AppBuilderAccordionUiWidgetComponentThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/AppBuilderAccordionUiWidgetComponent.theme.types";
import {AppBuilderAccordionWidgetComponentThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/AppBuilderAccordionWidgetComponent.theme.types";
import {AppBuilderAgentWidgetComponentThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/AppBuilderAgentWidgetComponent.theme.types";
import {AppBuilderAreaChartWidgetComponentThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/AppBuilderAreaChartWidgetComponent.theme.types";
import {AppBuilderAttributeVisualizationWidgetComponentThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/AppBuilderAttributeVisualizationWidgetComponent.theme.types";
import {AppBuilderBarChartWidgetComponentThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/AppBuilderBarChartWidgetComponent.theme.types";
import {AppBuilderControlsWidgetComponentThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/AppBuilderControlsWidgetComponent.theme.types";
import {AppBuilderFormWidgetComponentThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/AppBuilderFormWidgetComponent.theme.types";
import {AppBuilderImageThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/AppBuilderImage.theme.types";
import {AppBuilderLineChartWidgetComponentThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/AppBuilderLineChartWidgetComponent.theme.types";
import {AppBuilderRoundChartWidgetComponentThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/AppBuilderRoundChartWidgetComponent.theme.types";
import {AppBuilderSavedStatesWidgetComponentThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/AppBuilderSavedStatesWidgetComponent.theme.types";
import {AppBuilderStackUiWidgetThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/AppBuilderStackUiWidgetComponent.theme.types";
import {AppBuilderTableWidgetComponentThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/AppBuilderTableWidgetComponent.theme.types";
import {AppBuilderTextWidgetComponentThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/AppBuilderTextWidgetComponent.theme.types";
import {ParametersAndExportsAccordionComponentThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/ParametersAndExportsAccordionComponent.theme.types";
import {ViewportAcceptRejectButtonsThemeDefaultPropsSchema} from "@AppBuilderLib/widgets/appbuilder/config/ViewportAcceptRejectButtons.theme.types";
import {
	IDraggingParameterPropsJsonSchema,
	IGumballTransformParameterPropsJsonSchema,
	ISelectionParameterPropsJsonSchema,
} from "@shapediver/viewer.shared.types";
import {z} from "zod";
import {ExportLabelComponentThemeDefaultPropsSchema} from "~/shared/entities/export/config/ExportLabelComponent.types";
import {OutputChunkLabelComponentThemeDefaultPropsSchema} from "~/shared/entities/output/config/OutputChunkLabelComponent.types";
import {ParameterColorComponentThemeDefaultPropsSchema} from "~/shared/entities/parameter/config/ParameterColorComponent.types";
import {AppBuilderContainerThemeDefaultPropsSchema} from "~/shared/pages/config/AppBuilderContainer.types";
import {AppBuilderTemplateSelectorThemeDefaultPropsSchema} from "~/shared/pages/config/AppBuilderTemplateSelector.types";
import {AppBuilderVerticalContainerThemeDefaultPropsSchema} from "~/shared/pages/config/AppBuilderVerticalContainer.types";

/**
 * Zod schemas for theme `defaultProps` of components registered here.
 * Keys MUST match the first argument of `useProps` / `usePropsAppBuilder` for that component.
 * Only listed components get deep validation; others stay opaque (Mantine JSON rules).
 * Schemas live next to components (e.g. `Icon.types.ts`, `pages/misc/LoaderPage.types.ts`).
 */
export const themeComponentDefaultPropsRegistry = {
	Accordion: mantineAccordionPropsSchema,
	AppBuilderAccordionUiWidgetComponent:
		AppBuilderAccordionUiWidgetComponentThemeDefaultPropsSchema,
	AppBuilderAccordionWidgetComponent:
		AppBuilderAccordionWidgetComponentThemeDefaultPropsSchema,
	AppBuilderActionComponent: AppBuilderActionComponentThemeDefaultPropsSchema,
	AppBuilderAgentWidgetComponent:
		AppBuilderAgentWidgetComponentThemeDefaultPropsSchema,
	AppBuilderAppShellTemplatePage:
		AppBuilderAppShellTemplatePageThemeDefaultPropsSchema,
	AppBuilderAreaChartWidgetComponent:
		AppBuilderAreaChartWidgetComponentThemeDefaultPropsSchema,
	AppBuilderAttributeVisualizationWidgetComponent:
		AppBuilderAttributeVisualizationWidgetComponentThemeDefaultPropsSchema,
	AppBuilderBarChartWidgetComponent:
		AppBuilderBarChartWidgetComponentThemeDefaultPropsSchema,
	AppBuilderContainer: AppBuilderContainerThemeDefaultPropsSchema,
	AppBuilderContainerWrapper:
		AppBuilderContainerWrapperThemeDefaultPropsSchema,
	AppBuilderControlsWidgetComponent:
		AppBuilderControlsWidgetComponentThemeDefaultPropsSchema,
	AppBuilderFormWidgetComponent:
		AppBuilderFormWidgetComponentThemeDefaultPropsSchema,
	AppBuilderGridTemplatePage:
		AppBuilderGridTemplatePageThemeDefaultPropsSchema,
	AppBuilderHorizontalContainer: mantineGroupPropsSchema,
	AppBuilderImage: AppBuilderImageThemeDefaultPropsSchema,
	AppBuilderLineChartWidgetComponent:
		AppBuilderLineChartWidgetComponentThemeDefaultPropsSchema,
	AppBuilderRoundChartWidgetComponent:
		AppBuilderRoundChartWidgetComponentThemeDefaultPropsSchema,
	AppBuilderSavedStatesWidgetComponent:
		AppBuilderSavedStatesWidgetComponentThemeDefaultPropsSchema,
	AppBuilderStackUiWidgetComponent:
		AppBuilderStackUiWidgetThemeDefaultPropsSchema,
	AppBuilderTableWidgetComponent:
		AppBuilderTableWidgetComponentThemeDefaultPropsSchema,
	AppBuilderTemplateSelector:
		AppBuilderTemplateSelectorThemeDefaultPropsSchema,
	AppBuilderTextWidgetComponent:
		AppBuilderTextWidgetComponentThemeDefaultPropsSchema,
	AppBuilderVerticalContainer:
		AppBuilderVerticalContainerThemeDefaultPropsSchema,
	Button: mantineButtonPropsSchema,
	CreateModelStateHook: CreateModelStateHookThemeDefaultPropsSchema,
	DefaultSession: DefaultSessionThemeDefaultPropsSchema,
	DesktopClientPanel: DesktopClientPanelThemeDefaultPropsSchema,
	ExportButtonComponent: ExportButtonComponentThemeDefaultPropsSchema,
	ExportLabelComponent: ExportLabelComponentThemeDefaultPropsSchema,
	Group: mantineGroupPropsSchema,
	Hint: HintThemeDefaultPropsSchema,
	Icon: IconThemeDefaultPropsSchema,
	LoaderPage: LoaderPageThemeDefaultPropsSchema,
	MarkdownWidgetComponent: MarkdownWidgetComponentThemeDefaultPropsSchema,
	ModalBase: ModalBaseThemeDefaultPropsSchema,
	MultiSelectCheckboxes: MultiSelectCheckboxesThemeDefaultPropsSchema,
	NotificationWrapper: NotificationWrapperThemeDefaultPropsSchema,
	OutputChunkLabelComponent: OutputChunkLabelComponentThemeDefaultPropsSchema,
	OutputStargateComponent: OutputStargateComponentThemeDefaultPropsSchema,
	ParameterColorComponent: ParameterColorComponentThemeDefaultPropsSchema,
	ParameterDraggingComponent: IDraggingParameterPropsJsonSchema,
	ParameterGumballComponent: IGumballTransformParameterPropsJsonSchema,
	ParameterLabelComponent: ParameterLabelComponentThemeDefaultPropsSchema,
	ParameterRectangleTransformComponent:
		ParameterRectangleTransformComponentThemeDefaultPropsSchema,
	ParameterSelectComponent: ParameterSelectComponentThemeDefaultPropsSchema,
	ParameterSelectionComponent: ISelectionParameterPropsJsonSchema,
	ParameterSliderComponent: ParameterSliderComponentThemeDefaultPropsSchema,
	ParameterStargateComponent:
		ParameterStargateComponentThemeDefaultPropsSchema,
	Paper: mantinePaperPropsSchema,
	ParametersAndExportsAccordionComponent:
		ParametersAndExportsAccordionComponentThemeDefaultPropsSchema,
	SelectCarouselComponent: SelectCarouselComponentThemeDefaultPropsSchema,
	SelectFullWidthCardsComponent:
		SelectFullWidthCardsComponentThemeDefaultPropsSchema,
	SelectGridComponent: SelectGridComponentThemeDefaultPropsSchema,
	StargateInput: StargateInputThemeDefaultPropsSchema,
	StargateShared: StargateSharedThemeDefaultPropsSchema,
	Text: mantineTextPropsSchema,
	TooltipWrapper: TooltipWrapperThemeDefaultPropsSchema,
	ViewportAcceptRejectButtons:
		ViewportAcceptRejectButtonsThemeDefaultPropsSchema,
	ViewportBranding: ViewportBrandingThemeDefaultPropsSchema,
	ViewportComponent: ViewportComponentThemeDefaultPropsSchema,
	ViewportIconButton: ViewportIconButtonThemeDefaultPropsSchema,
	ViewportIconButtonDropdowns:
		ViewportIconButtonDropdownThemeDefaultPropsSchema,
	ViewportIcons: ViewportIconsThemeDefaultPropsSchema,
	ViewportOverlayWrapper: ViewportOverlayWrapperThemeDefaultPropsSchema,
} as const satisfies Record<string, z.ZodTypeAny>;

export type ThemeComponentDefaultPropsRegistryKey =
	keyof typeof themeComponentDefaultPropsRegistry;
