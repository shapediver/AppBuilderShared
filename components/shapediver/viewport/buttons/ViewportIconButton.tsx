import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
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
import {Icon, IconProps} from "~/shared/shared/ui/Icon";
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

	const isTextIcon =
		typeof iconType === "string" && iconType.startsWith("SD_");

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
				w={isTextIcon ? "100%" : undefined}
			>
				{isTextIcon ? (
					<Box
						p={"xs"}
						style={{
							color: iconProps?.color,
						}}
					>
						{iconType.substring(3)}
					</Box>
				) : (
					<Icon
						iconType={iconType}
						color={disabled ? colorDisabled : color}
						{...restIconProps}
					/>
				)}
			</ActionIcon>
		</TooltipWrapper>
	);
}
