import {
	MantineThemeComponent,
	MantineThemeOverride,
	Tooltip,
	TooltipProps,
	useMantineTheme,
	useProps,
} from "@mantine/core";
import React from "react";
import ThemeProvider from "../shapediver/ui/ThemeProvider";

interface TooltipWrapperProps {
	floating?: boolean;
	themeOverride?: MantineThemeOverride;
}

const defaultStyleProps: Partial<TooltipWrapperProps & TooltipProps> = {
	withArrow: true,
	//keepMounted: true,
};

type TooltipWrapperThemePropsType = Partial<TooltipWrapperProps & TooltipProps>;

export function TooltipWrapperThemeProps(
	props: TooltipWrapperThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Wrapper for tooltips.
 * @param props
 * @returns
 */
export default function TooltipWrapper(
	props: TooltipWrapperProps & TooltipProps,
) {
	const {children = <></>, ...rest} = props;
	const {color, floating, themeOverride, label, ..._props} = useProps(
		"TooltipWrapper",
		defaultStyleProps,
		rest,
	);
	const theme = useMantineTheme();

	const _label = themeOverride ? (
		<ThemeProvider theme={themeOverride}>{label}</ThemeProvider>
	) : (
		label
	);

	return floating ? (
		<Tooltip.Floating
			color={color ?? theme.primaryColor}
			label={_label}
			position={_props.position}
			withinPortal={_props.withinPortal}
			portalProps={_props.portalProps}
			radius={_props.radius}
			multiline={_props.multiline}
			zIndex={_props.zIndex}
		>
			{children}
		</Tooltip.Floating>
	) : (
		<Tooltip color={color ?? theme.primaryColor} label={_label} {..._props}>
			{children}
		</Tooltip>
	);
}
