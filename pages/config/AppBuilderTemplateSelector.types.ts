import {appBuilderTemplateThemeIdSchema} from "~/shared/features/appbuilder/lib/AppBuilderTemplate";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("AppBuilderTemplateSelector", …)`. */
export const AppBuilderTemplateSelectorThemeDefaultPropsSchema = z.strictObject({
	template: appBuilderTemplateThemeIdSchema.optional(),
	showContainerButtons: z.boolean().optional(),
});

/** TypeDoc surface for `useProps("AppBuilderTemplateSelector", …)` theme defaults. */
export interface AppBuilderTemplateSelectorThemeDefaultProps
	extends z.infer<typeof AppBuilderTemplateSelectorThemeDefaultPropsSchema> {}
