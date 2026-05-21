import {ExportLabelComponentThemeDefaultPropsSchema} from "@AppBuilderLib/entities/export/ui/ExportLabelComponent.types";
import {OutputChunkLabelComponentThemeDefaultPropsSchema} from "@AppBuilderLib/entities/output/ui/OutputChunkLabelComponent.types";
import {
	ParameterDraggingComponentThemeDefaultPropsSchema,
	ParameterGumballComponentThemeDefaultPropsSchema,
	ParameterSelectionComponentThemeDefaultPropsSchema,
} from "@AppBuilderLib/entities/parameter/config/theme/parameterInteractionThemeDefaultProps";
import {ParameterColorComponentThemeDefaultPropsSchema} from "@AppBuilderLib/entities/parameter/ui/ParameterColorComponent.types";
import {ParameterSliderComponentThemeDefaultPropsSchema} from "@AppBuilderLib/entities/parameter/ui/ParameterSliderComponent.types";
import {StargateSharedThemeDefaultPropsSchema} from "@AppBuilderLib/entities/stargate/ui/stargateShared";
import {CreateModelStateHookThemeDefaultPropsSchema} from "@AppBuilderLib/features/model-state/model/useCreateModelState.types";
import {NotificationWrapperThemeDefaultPropsSchema} from "@AppBuilderLib/features/notifications/config/notificationcontext";
import {LoaderPageThemeDefaultPropsSchema} from "@AppBuilderLib/pages/misc/LoaderPage.types";
import {AppBuilderContainerThemeDefaultPropsSchema} from "@AppBuilderLib/pages/templates/AppBuilderContainer.types";
import {AppBuilderHorizontalContainerThemeDefaultPropsSchema} from "@AppBuilderLib/pages/templates/AppBuilderHorizontalContainer.types";
import {AppBuilderTemplateSelectorThemeDefaultPropsSchema} from "@AppBuilderLib/pages/templates/AppBuilderTemplateSelector.types";
import {AppBuilderVerticalContainerThemeDefaultPropsSchema} from "@AppBuilderLib/pages/templates/AppBuilderVerticalContainer.types";
import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {z} from "zod";

/**
 * Zod schemas for theme `defaultProps` of components registered here.
 * Keys MUST match the first argument of `useProps` / `usePropsAppBuilder` for that component.
 * Only listed components get deep validation; others stay opaque (Mantine JSON rules).
 * Schemas live next to components (e.g. `Icon.types.ts`, `pages/misc/LoaderPage.types.ts`).
 */
export const themeComponentDefaultPropsRegistry = {
	AppBuilderContainer: AppBuilderContainerThemeDefaultPropsSchema,
	AppBuilderHorizontalContainer: AppBuilderHorizontalContainerThemeDefaultPropsSchema,
	AppBuilderTemplateSelector: AppBuilderTemplateSelectorThemeDefaultPropsSchema,
	AppBuilderVerticalContainer: AppBuilderVerticalContainerThemeDefaultPropsSchema,
	CreateModelStateHook: CreateModelStateHookThemeDefaultPropsSchema,
	ExportLabelComponent: ExportLabelComponentThemeDefaultPropsSchema,
	Icon: IconThemeDefaultPropsSchema,
	LoaderPage: LoaderPageThemeDefaultPropsSchema,
	OutputChunkLabelComponent: OutputChunkLabelComponentThemeDefaultPropsSchema,
	ParameterColorComponent: ParameterColorComponentThemeDefaultPropsSchema,
	ParameterDraggingComponent: ParameterDraggingComponentThemeDefaultPropsSchema,
	ParameterGumballComponent: ParameterGumballComponentThemeDefaultPropsSchema,
	ParameterSelectionComponent: ParameterSelectionComponentThemeDefaultPropsSchema,
	ParameterSliderComponent: ParameterSliderComponentThemeDefaultPropsSchema,
	StargateShared: StargateSharedThemeDefaultPropsSchema,
	NotificationWrapper: NotificationWrapperThemeDefaultPropsSchema,
} as const satisfies Record<string, z.ZodTypeAny>;

export type ThemeComponentDefaultPropsRegistryKey = keyof typeof themeComponentDefaultPropsRegistry;
