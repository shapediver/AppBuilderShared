import {mantineTooltipPropsSchema} from "@AppBuilderLib/shared/mantine-props/tooltip";
import {z} from "zod";

/** App-only theme keys (not Mantine `Tooltip` JSON props). */
const tooltipWrapperAppThemePropsSchema = z.strictObject({
	floating: z.boolean().optional(),
});

/** Theme `defaultProps` for `useProps("TooltipWrapper", …)` (JSON-serializable only). */
export const TooltipWrapperThemeDefaultPropsSchema =
	mantineTooltipPropsSchema.merge(tooltipWrapperAppThemePropsSchema);

/** TypeDoc surface for `useProps("TooltipWrapper", …)` theme defaults. */
export interface TooltipWrapperThemeDefaultProps
	extends z.infer<typeof TooltipWrapperThemeDefaultPropsSchema> {}
