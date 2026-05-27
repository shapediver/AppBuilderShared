import type {MantineTooltipProps} from "@AppBuilderLib/shared/mantine-props/tooltip";
import {MantineThemeOverride, TooltipProps} from "@mantine/core";

export interface TooltipWrapperProps {
	floating?: boolean;
	/** Runtime-only; excluded from theme JSON schema. */
	themeOverride?: MantineThemeOverride;
}

export type TooltipWrapperThemePropsType = Partial<
	Pick<TooltipWrapperProps, "floating"> & MantineTooltipProps
>;

export type TooltipWrapperComponentProps = TooltipWrapperProps & TooltipProps;
