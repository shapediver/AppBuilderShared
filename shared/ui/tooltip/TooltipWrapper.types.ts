import {MantineThemeOverride, TooltipProps} from "@mantine/core";

/**
 * Custom tooltip wrapper props merged with Mantine `TooltipProps` via `useProps`.
 *
 * @docAttached
 * @configPath themeOverrides.components.TooltipWrapper.defaultProps
 * @displayName TooltipWrapper
 */
export interface TooltipWrapperProps {
	floating?: boolean;
	themeOverride?: MantineThemeOverride;
	/**
	 * Show tooltip arrow (standard Mantine Tooltip).
	 * @default true
	 */
	withArrow?: boolean;
}

export type TooltipWrapperThemePropsType = Partial<
	TooltipWrapperProps & TooltipProps
>;

export type TooltipWrapperComponentProps = TooltipWrapperProps & TooltipProps;
