import {Icon, IconProps} from "@AppBuilderLib/shared/ui/icon";
import {TooltipWrapper} from "@AppBuilderLib/shared/ui/tooltip";
import {
	ActionIcon,
	ActionIconProps,
	Box,
	MantineStyleProp,
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
	styles?: MantineStyleProp;
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
	onMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
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

export const defaultStyleProps: StyleProps = {
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

export type ViewportIconButtonThemePropsType = Partial<StyleProps>;

export function ViewportIconButtonThemeProps(
	props: ViewportIconButtonThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

const iconRegex = new RegExp("^[a-z0-9-]+$");

export default function ViewportIconButton(
	props: Props & ViewportIconButtonThemePropsType,
) {
	const {
		label,
		iconType,
		disabled = false,
		styles,
		onClick,
		onMouseDown,
		...rest
	} = props;

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

	// if the iconType only contain lowercase letters, numbers and dashes
	// we consider it as text and render the text instead of an icon
	const isIcon = iconRegex.test(iconType);

	return (
		<TooltipWrapper label={label ?? ""} {...tooltipWrapperProps}>
			<ActionIcon
				onClick={onClick}
				onMouseDown={onMouseDown}
				disabled={disabled}
				variant={disabled ? variantDisabled : variant}
				aria-label={label ?? undefined}
				className={classes.ViewportIcon}
				{...restActionIconProps}
				styles={{...restActionIconProps.styles, ...styles}}
				w={isIcon ? undefined : "100%"}
			>
				{isIcon ? (
					<Icon
						iconType={iconType}
						color={disabled ? colorDisabled : color}
						{...restIconProps}
					/>
				) : (
					<Box
						p={"xs"}
						style={{
							color: iconProps?.color,
						}}
					>
						{
							// if the iconType starts with "SD_", we remove the "SD_" prefix and render the rest as text
							// this was initially implemented as a way to determine text from icons
							// and can still be used for specific cases like numbers that match existing icon names
							iconType.startsWith("SD_")
								? iconType.substring(3)
								: iconType
						}
					</Box>
				)}
			</ActionIcon>
		</TooltipWrapper>
	);
}
