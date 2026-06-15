import {mantineCssLengthSchema} from "@AppBuilderLib/shared/mantine-props/primitives.zod";
import {mantineSpacingSchema} from "@AppBuilderLib/shared/mantine-props/spacing.zod";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("AppBuilderImage", …)`. */
export const AppBuilderImageThemeDefaultPropsSchema = z.strictObject({
	radius: mantineSpacingSchema.optional(),
	mah: mantineCssLengthSchema.optional(),
	maw: mantineCssLengthSchema.optional(),
	fit: z.enum(["contain", "scale-down"]).optional(),
	withBorder: z.boolean().optional(),
	isSvg: z.boolean().optional(),
});

export type AppBuilderImageThemeDefaultProps = z.infer<
	typeof AppBuilderImageThemeDefaultPropsSchema
>;
