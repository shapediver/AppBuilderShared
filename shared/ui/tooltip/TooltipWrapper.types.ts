import {MantineThemeOverride, TooltipProps} from "@mantine/core";
import type {TooltipWrapperThemeDefaultProps} from "./TooltipWrapper.theme.types";

export interface TooltipWrapperProps extends TooltipWrapperThemeDefaultProps {
	/** Runtime-only; excluded from theme JSON schema. */
	themeOverride?: MantineThemeOverride;
	/**
	 * Show tooltip arrow (standard Mantine Tooltip).
	 * @default true
	 */
	withArrow?: boolean;
}

/**
 * Runtime component props — Mantine `TooltipProps` for tooltip fields;
 * only app-specific keys from {@link TooltipWrapperProps} (not JSON mirror overlap).
 */
export type TooltipWrapperComponentProps = Pick<
	TooltipWrapperProps,
	"floating" | "themeOverride"
> &
	TooltipProps;
