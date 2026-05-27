import {mantineTooltipPropsSchema} from "@AppBuilderLib/shared/mantine-props/tooltip.zod";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("TooltipWrapper", …)` (JSON-serializable only). */
export const TooltipWrapperThemeDefaultPropsSchema =
	mantineTooltipPropsSchema.extend({
		floating: z.boolean().optional(),
	});

export type TooltipWrapperThemeDefaultProps = z.infer<
	typeof TooltipWrapperThemeDefaultPropsSchema
>;
