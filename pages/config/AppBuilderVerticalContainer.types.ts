import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";
import type {MantineSpacing} from "@AppBuilderLib/shared/mantine-props/spacing";

/** Theme `defaultProps` for `useProps("AppBuilderVerticalContainer", …)` — Stack spacing only. */
export const AppBuilderVerticalContainerThemeDefaultPropsSchema =
	mantineGroupPropsSchema.pick({gap: true, p: true});

/**
 * @docAttached
 * @category page
 * @configPath themeOverrides.components.AppBuilderVerticalContainer.defaultProps
 * @displayName AppBuilderVerticalContainer
 */
export interface AppBuilderVerticalContainerThemeDefaultProps extends z.infer<
	typeof AppBuilderVerticalContainerThemeDefaultPropsSchema
> {
	/**
	 * Gap between children. Omitted keeps the Stack theme gap.
	 */
	gap?: MantineSpacing;
	/**
	 * Stack padding
	 * @default "xs"
	 */
	p?: MantineSpacing;
}
