import type {MantineThemeOverrideProps} from "@AppBuilderLib/shared/mantine-props/themeOverride";
import {mantineThemeOverridePropsSchema} from "@AppBuilderLib/shared/mantine-props/themeOverride.zod";
import type {MantineTooltipProps} from "@AppBuilderLib/shared/mantine-props/tooltip";
import {mantineTooltipPropsSchema} from "@AppBuilderLib/shared/mantine-props/tooltip";
import {z} from "zod";

/** App-only theme keys (not Mantine `Tooltip` JSON props). */
const tooltipWrapperAppThemePropsSchema = z.strictObject({
	floating: z.boolean().optional(),
	themeOverride: mantineThemeOverridePropsSchema.optional(),
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
export interface TooltipWrapperThemeDefaultProps extends MantineTooltipProps {
	/** Use Mantine `Tooltip.Floating` (follows the pointer) instead of the standard `Tooltip`. */
	floating?: boolean;
	/** Show tooltip arrow (standard Mantine Tooltip) (Mantine default: `true`) */
	withArrow?: boolean;
	/** Nested Mantine theme applied to tooltip label content. */
	themeOverride?: MantineThemeOverrideProps;
}
