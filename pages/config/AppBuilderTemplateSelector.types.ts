import type {IAppBuilderMobileFallbacks} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {appBuilderMobileFallbacksThemeSchema} from "@AppBuilderLib/features/appbuilder/config/appbuilderMobileFallback";
import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineBreakpointSchema} from "@AppBuilderLib/shared/mantine-props/primitives.zod";
import type {MantineSize} from "@mantine/core";
import type {AppBuilderTemplateThemeId} from "~/shared/features/appbuilder/lib/AppBuilderTemplate";
import {appBuilderTemplateThemeIdSchema} from "~/shared/features/appbuilder/lib/AppBuilderTemplate";

/** Theme `defaultProps` for `useProps("AppBuilderTemplateSelector", …)`. */
export const AppBuilderTemplateSelectorThemeDefaultPropsSchema = z.strictObject(
	{
		template: appBuilderTemplateThemeIdSchema.optional(),
		showContainerButtons: z.boolean().optional(),
		mobileBreakpoint: mantineBreakpointSchema.optional(),
		mobileFallbacks: appBuilderMobileFallbacksThemeSchema.optional(),
	},
);

/**
 * @docAttached
 * @category page
 * @configPath themeOverrides.components.AppBuilderTemplateSelector.defaultProps
 * @displayName AppBuilderTemplateSelector
 */
export interface AppBuilderTemplateSelectorThemeDefaultProps extends z.infer<
	typeof AppBuilderTemplateSelectorThemeDefaultPropsSchema
> {
	/**
	 * Layout template key to render
	 * @default "appshell"
	 */
	template?: AppBuilderTemplateThemeId;
	/**
	 * Show UI buttons for toggling template containers (top/left/right/bottom)
	 * @default false
	 */
	showContainerButtons?: boolean;
	/**
	 * Breakpoint below which standard-container `mobileFallbacks` and
	 * viewport-anchor `mobileFallback` apply. Independent of which
	 * template is selected. AppShell `navbarBreakpoint` defaults to this.
	 * @default "md"
	 */
	mobileBreakpoint?: MantineSize;
	/**
	 * Per-container mobile fallbacks applied below `mobileBreakpoint`.
	 * General default; JSON `props.mobileFallback` overlays defined fields
	 * on a single container. Omitted JSON keeps this theme entry.
	 * @example { right: { container: "bottom", position: "after" } }
	 */
	mobileFallbacks?: IAppBuilderMobileFallbacks;
}
