import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineTooltipPropsSchema} from "@AppBuilderLib/shared/mantine-props/tooltip.zod";

/** Theme `defaultProps` for `useProps("ParameterLabelComponent", …)`. */
export const ParameterLabelComponentThemeDefaultPropsSchema = z.strictObject({
	tooltipProps: mantineTooltipPropsSchema.optional(),
	fontWeight: z.string().optional(),
});

export type ParameterLabelComponentThemeDefaultProps = z.infer<
	typeof ParameterLabelComponentThemeDefaultPropsSchema
>;
