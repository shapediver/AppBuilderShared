import {MantineThemeOverride, TooltipProps} from "@mantine/core";

export interface TooltipWrapperProps {
	floating?: boolean;
	themeOverride?: MantineThemeOverride;
}

export type TooltipWrapperThemePropsType = Partial<
	TooltipWrapperProps & TooltipProps
>;

export type TooltipWrapperComponentProps = TooltipWrapperProps & TooltipProps;
