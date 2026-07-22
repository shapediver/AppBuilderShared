import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";
import {mantineTooltipPropsSchema} from "@AppBuilderLib/shared/mantine-props/tooltip.zod";

/** Theme `defaultProps` for `useProps("ExportButtonComponent", …)`. */
export const ExportButtonComponentThemeDefaultPropsSchema = z.strictObject({
	buttonProps: mantineButtonPropsSchema.optional(),
	downloadTooltipProps: mantineTooltipPropsSchema.optional(),
	downloadButtonProps: mantineButtonPropsSchema.optional(),
	buttonLabel: z.string().optional(),
});

export type ExportButtonComponentThemeDefaultProps = z.infer<
	typeof ExportButtonComponentThemeDefaultPropsSchema
>;
