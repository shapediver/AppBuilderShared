import {MantineThemeOverride, TooltipProps} from "@mantine/core";
import type {TooltipWrapperThemeDefaultProps} from "./TooltipWrapper.theme.types";

/** Runtime component props (theme JSON props + runtime-only fields). */
export type TooltipWrapperProps = TooltipWrapperThemeDefaultProps & {
	/** Nested Mantine theme for label content (also valid in theme JSON `defaultProps`). */
	themeOverride?: MantineThemeOverride;
	/**
	 * Show tooltip arrow (standard Mantine Tooltip).
	 * @default true
	 */
	withArrow?: boolean;
};

/**
 * Runtime component props — Mantine `TooltipProps` for tooltip fields;
 * only app-specific keys from {@link TooltipWrapperProps} (not JSON mirror overlap).
 */
export type TooltipWrapperComponentProps = Pick<
	TooltipWrapperProps,
	"floating" | "themeOverride"
> &
	TooltipProps;
