import {
	MantineThemeComponent,
	Tooltip,
	useMantineTheme,
	useProps,
} from "@mantine/core";
import React from "react";
import {ThemeProvider} from "~/shared/shared/ui/ThemeProvider";
import {
	TooltipWrapperComponentProps,
	TooltipWrapperThemePropsType,
} from "./TooltipWrapper.types";

const defaultStyleProps: Partial<TooltipWrapperComponentProps> = {
	withArrow: true,
	//keepMounted: true,
};

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
export default function TooltipWrapper(props: TooltipWrapperComponentProps) {
	const {children = <></>, ...rest} = props;
	const {color, floating, themeOverride, label, ..._props} = useProps(
		"TooltipWrapper",
		defaultStyleProps,
		rest,
	);
	const theme = useMantineTheme();

	if (!label) {
		return <>{children}</>;
	}

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
