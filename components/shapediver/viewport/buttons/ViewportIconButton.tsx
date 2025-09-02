import Icon, {IconProps} from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {
	ActionIcon,
	ActionIconProps,
	MantineThemeComponent,
	TooltipProps,
	useProps,
} from "@mantine/core";
import React from "react";
import classes from "../ViewportIcons.module.css";
import {IconProps as IconPropsType} from "./types";

interface Props {
	label: string;
	iconType: string;
	disabled?: boolean;
	onClick?: () => void;
}

type StyleProps = {
	tooltipWrapperProps?: Partial<TooltipProps>;
	actionIconProps?: ActionIconProps & {
		variantDisabled?: string;
	};
	iconProps?: Partial<IconProps> & {
		colorDisabled?: string;
	};
};

export type ViewportIconButtonProps = Props & StyleProps;

const defaultStyleProps: StyleProps = {
	tooltipWrapperProps: {},
	actionIconProps: {
		size: IconPropsType.size,
		variant: IconPropsType.variant,
		variantDisabled: IconPropsType.variantDisabled,
		style: IconPropsType.style,
	},
	iconProps: {
		color: IconPropsType.color,
		colorDisabled: IconPropsType.colorDisabled,
	},
};

type ViewportIconButtonThemePropsType = Partial<StyleProps>;

export function ViewportIconButtonThemeProps(
	props: ViewportIconButtonThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function ViewportIconButton(
	props: Props & ViewportIconButtonThemePropsType,
) {
	const {label, iconType, disabled = false, onClick, ...rest} = props;

	const {tooltipWrapperProps, actionIconProps, iconProps} = useProps(
		"ViewportIconButton",
		defaultStyleProps,
		rest,
	);

	const {variant, variantDisabled, ...restActionIconProps} = {
		...defaultStyleProps.actionIconProps,
		...actionIconProps,
	};
	const {color, colorDisabled, ...restIconProps} = {
		...defaultStyleProps.iconProps,
		...iconProps,
	};

	return (
		<TooltipWrapper label={label ?? ""} {...tooltipWrapperProps}>
			<ActionIcon
				onClick={onClick}
				disabled={disabled}
				variant={disabled ? variantDisabled : variant}
				aria-label={label ?? "Button"}
				className={classes.ViewportIcon}
				{...restActionIconProps}
			>
				<Icon
					iconType={iconType}
					color={disabled ? colorDisabled : color}
					{...restIconProps}
				/>
			</ActionIcon>
		</TooltipWrapper>
	);
}
