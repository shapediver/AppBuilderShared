import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineActionIconPropsSchema} from "@AppBuilderLib/shared/mantine-props/actionIcon.zod";
import {mantineTooltipPropsSchema} from "@AppBuilderLib/shared/mantine-props/tooltip.zod";
import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon/Icon.types";

/** Theme `defaultProps` for `useProps("ParameterStargateComponent", …)`. */
export const ParameterStargateComponentThemeDefaultPropsSchema = z.strictObject(
	{
		tooltipProps: mantineTooltipPropsSchema.optional(),
		actionIconProps: mantineActionIconPropsSchema.optional(),
		iconProps: IconThemeDefaultPropsSchema.optional(),
	},
);

export type ParameterStargateComponentThemeDefaultProps = z.infer<
	typeof ParameterStargateComponentThemeDefaultPropsSchema
>;
