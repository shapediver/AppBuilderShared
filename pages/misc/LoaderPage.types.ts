import type {MantineSpacing} from "@AppBuilderLib/shared/mantine-props/spacing";
import {mantineSpacingSchema} from "@AppBuilderLib/shared/mantine-props/spacing";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("LoaderPage", …)`. */
export const LoaderPageThemeDefaultPropsSchema = z.strictObject({
	type: z.string().optional(),
	size: mantineSpacingSchema.optional(),
});

/**
 * @docAttached
 * @category page
 * @configPath themeOverrides.components.LoaderPage.defaultProps
 * @displayName LoaderPage
 */
export interface LoaderPageThemeDefaultProps extends z.infer<
	typeof LoaderPageThemeDefaultPropsSchema
> {
	/**
	 * Type of the loader
	 * @see https://mantine.dev/core/loader/?t=props
	 * @default "oval"
	 */
	type?: string;
	/**
	 * Size of the loader (Mantine spacing token or CSS length)
	 * @see https://mantine.dev/core/loader/?t=props
	 * @default "md"
	 */
	size?: MantineSpacing;
}
