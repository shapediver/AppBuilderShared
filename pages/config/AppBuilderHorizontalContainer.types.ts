import type {
	MantineCssLength,
	MantineFlexWrap,
} from "@AppBuilderLib/shared/mantine-props/primitives";
import type {MantineSpacing} from "@AppBuilderLib/shared/mantine-props/spacing";
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";
import {z} from "zod";

export const AppBuilderHorizontalContainerThemeDefaultPropsSchema =
	mantineGroupPropsSchema;

/**
 * @docAttached
 * @category page
 * @configPath themeOverrides.components.AppBuilderHorizontalContainer.defaultProps
 * @displayName AppBuilderHorizontalContainer
 */
export interface AppBuilderHorizontalContainerThemeDefaultProps
	extends z.infer<typeof AppBuilderHorizontalContainerThemeDefaultPropsSchema> {
	/**
	 * Group width
	 * @default "100%"
	 */
	w?: MantineCssLength;
	/**
	 * Group height
	 * @default "100%"
	 */
	h?: MantineCssLength;
	/**
	 * Flex justify-content
	 * @default "center"
	 */
	justify?: string;
	/**
	 * Flex wrap
	 * @default "nowrap"
	 */
	wrap?: MantineFlexWrap;
	/**
	 * Padding (Mantine spacing)
	 * @default "xs"
	 */
	p?: MantineSpacing;
}
