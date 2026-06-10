import {mantineTooltipPropsSchema} from "@AppBuilderLib/shared/mantine-props/tooltip";
import {z} from "zod";

/** App-only theme keys (not Mantine `Tooltip` JSON props). */
const tooltipWrapperAppThemePropsSchema = z.strictObject({
	floating: z.boolean().optional(),
});

/** Theme `defaultProps` for `useProps("TooltipWrapper", …)` (JSON-serializable only). */
export const TooltipWrapperThemeDefaultPropsSchema =
	mantineTooltipPropsSchema.merge(tooltipWrapperAppThemePropsSchema);

/**
 * Custom tooltip wrapper props merged with Mantine `TooltipProps` via `useProps`.
 *
 * @docAttached
 * @category shared
 * @configPath themeOverrides.components.TooltipWrapper.defaultProps
 * @displayName TooltipWrapper
 */
export interface TooltipWrapperThemeDefaultProps
	extends z.infer<typeof TooltipWrapperThemeDefaultPropsSchema> {
	/**
	 * Use Mantine `Tooltip.Floating` (follows the pointer) instead of the standard `Tooltip`.
	 * @default false
	 */
	floating?: boolean;
	/**
	 * Show tooltip arrow (standard Mantine Tooltip).
	 * @default true
	 */
	withArrow?: boolean;
}
