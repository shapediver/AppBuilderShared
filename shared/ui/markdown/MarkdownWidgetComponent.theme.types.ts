import {mantineThemeOverridePropsSchema} from "@AppBuilderLib/shared/mantine-props/themeOverride.zod";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("MarkdownWidgetComponent", …)`. */
export const MarkdownWidgetComponentThemeDefaultPropsSchema = z.strictObject({
	anchorTarget: z.string().optional(),
	boldFontWeight: z.string().optional(),
	strongFontWeight: z.string().optional(),
	setHeadingFontSize: z.boolean().optional(),
	themeOverride: mantineThemeOverridePropsSchema.optional(),
});

export type MarkdownWidgetComponentThemeDefaultProps = z.infer<
	typeof MarkdownWidgetComponentThemeDefaultPropsSchema
>;
