import {z} from "zod";
import type {AppBuilderTemplateThemeId} from "~/shared/features/appbuilder/lib/AppBuilderTemplate";
import {appBuilderTemplateThemeIdSchema} from "~/shared/features/appbuilder/lib/AppBuilderTemplate";

/** Theme `defaultProps` for `useProps("AppBuilderTemplateSelector", …)`. */
export const AppBuilderTemplateSelectorThemeDefaultPropsSchema = z.strictObject(
	{
		template: appBuilderTemplateThemeIdSchema.optional(),
		showContainerButtons: z.boolean().optional(),
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
}
