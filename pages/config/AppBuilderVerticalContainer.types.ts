import type {MantineSpacing} from "@AppBuilderLib/shared/mantine-props/spacing";
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("AppBuilderVerticalContainer", …)` — Stack spacing only. */
export const AppBuilderVerticalContainerThemeDefaultPropsSchema =
	mantineGroupPropsSchema.pick({p: true});

/**
 * @docAttached
 * @category page
 * @configPath themeOverrides.components.AppBuilderVerticalContainer.defaultProps
 * @displayName AppBuilderVerticalContainer
 */
export interface AppBuilderVerticalContainerThemeDefaultProps
	extends z.infer<typeof AppBuilderVerticalContainerThemeDefaultPropsSchema> {
	/**
	 * Stack padding
	 * @default "xs"
	 */
	p?: MantineSpacing;
}
