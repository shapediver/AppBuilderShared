import {ExportLabelComponentThemeDefaultPropsSchema} from "~/shared/entities/export/config/ExportLabelComponent.types";
import {OutputChunkLabelComponentThemeDefaultPropsSchema} from "~/shared/entities/output/config/OutputChunkLabelComponent.types";
import {ParameterColorComponentThemeDefaultPropsSchema} from "~/shared/entities/parameter/config/ParameterColorComponent.types";
import {ParameterSliderComponentThemeDefaultPropsSchema} from "@AppBuilderLib/entities/parameter/ui/ParameterSliderComponent.types";
import {StargateSharedThemeDefaultPropsSchema} from "@AppBuilderLib/entities/stargate/ui/stargateShared";
import {CreateModelStateHookThemeDefaultPropsSchema} from "@AppBuilderLib/features/model-state/model/useCreateModelState.types";
import {NotificationWrapperThemeDefaultPropsSchema} from "@AppBuilderLib/features/notifications/config/notificationcontext";
import {LoaderPageThemeDefaultPropsSchema} from "@AppBuilderLib/pages/misc/LoaderPage.types";
import {AppBuilderContainerThemeDefaultPropsSchema} from "~/shared/pages/config/AppBuilderContainer.types";
import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";
import {AppBuilderTemplateSelectorThemeDefaultPropsSchema} from "~/shared/pages/config/AppBuilderTemplateSelector.types";
import {AppBuilderVerticalContainerThemeDefaultPropsSchema} from "~/shared/pages/config/AppBuilderVerticalContainer.types";
import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {z} from "zod";
import {
	IDraggingParameterPropsJsonSchema,
	IGumballTransformParameterPropsJsonSchema, ISelectionParameterPropsJsonSchema,
} from "@shapediver/viewer.shared.types/dist/interfaces/parameter/IInteractionParameterSettings";

/**
 * Zod schemas for theme `defaultProps` of components registered here.
 * Keys MUST match the first argument of `useProps` / `usePropsAppBuilder` for that component.
 * Only listed components get deep validation; others stay opaque (Mantine JSON rules).
 * Schemas live next to components (e.g. `Icon.types.ts`, `pages/misc/LoaderPage.types.ts`).
 */
export const themeComponentDefaultPropsRegistry = {
	AppBuilderContainer: AppBuilderContainerThemeDefaultPropsSchema,
	AppBuilderHorizontalContainer: mantineGroupPropsSchema,
	AppBuilderTemplateSelector:
		AppBuilderTemplateSelectorThemeDefaultPropsSchema,
	AppBuilderVerticalContainer:
		AppBuilderVerticalContainerThemeDefaultPropsSchema,
	Button: mantineButtonPropsSchema,
	CreateModelStateHook: CreateModelStateHookThemeDefaultPropsSchema,
	ExportLabelComponent: ExportLabelComponentThemeDefaultPropsSchema,
	Group: mantineGroupPropsSchema,
	Icon: IconThemeDefaultPropsSchema,
	LoaderPage: LoaderPageThemeDefaultPropsSchema,
	OutputChunkLabelComponent: OutputChunkLabelComponentThemeDefaultPropsSchema,
	ParameterColorComponent: ParameterColorComponentThemeDefaultPropsSchema,
	ParameterDraggingComponent: IDraggingParameterPropsJsonSchema,
	ParameterGumballComponent: IGumballTransformParameterPropsJsonSchema,
	ParameterSelectionComponent: ISelectionParameterPropsJsonSchema,
	ParameterSliderComponent: ParameterSliderComponentThemeDefaultPropsSchema,
	StargateShared: StargateSharedThemeDefaultPropsSchema,
	NotificationWrapper: NotificationWrapperThemeDefaultPropsSchema,
} as const satisfies Record<string, z.ZodTypeAny>;

export type ThemeComponentDefaultPropsRegistryKey = keyof typeof themeComponentDefaultPropsRegistry;
