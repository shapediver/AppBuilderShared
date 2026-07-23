import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineCssLengthSchema} from "@AppBuilderLib/shared/mantine-props/primitives.zod";
import {mantineSpacingSchema} from "@AppBuilderLib/shared/mantine-props/spacing.zod";

/** Theme `defaultProps` for `useProps("AppBuilderPdfEmbed", …)`. */
export const AppBuilderPdfEmbedThemeDefaultPropsSchema = z.strictObject({
	radius: mantineSpacingSchema.optional(),
	mah: mantineCssLengthSchema.optional(),
	maw: mantineCssLengthSchema.optional(),
	fit: z.enum(["contain", "scale-down"]).optional(),
	withBorder: z.boolean().optional(),
});

export type AppBuilderPdfEmbedThemeDefaultProps = z.infer<
	typeof AppBuilderPdfEmbedThemeDefaultPropsSchema
>;
