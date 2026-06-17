import type {MantineTooltipProps} from "@AppBuilderLib/shared/mantine-props/tooltip";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import {IconProps} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import TooltipWrapper from "@AppBuilderLib/shared/ui/tooltip/TooltipWrapper";
import {
	ActionIcon,
	Box,
	MantineStyleProp,
	MantineThemeComponent,
	useProps,
} from "@mantine/core";
import React from "react";
import {
	ViewportIconButtonDefaultStyleProps,
	ViewportIconButtonStyleProps,
} from "../config/viewportIcons";
import classes from "./ViewportIcons.module.css";

interface Props {
	label: string;
	iconType: string;
	disabled?: boolean;
	styles?: MantineStyleProp;
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
	onMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
}

/**
 * Theme defaults for a single viewport toolbar icon button.
 *
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ViewportIconButton.defaultProps
 * @displayName ViewportIconButton
 */
export type ViewportIconButtonThemeStyleProps = ViewportIconButtonStyleProps & {
	tooltipWrapperProps?: MantineTooltipProps;
	iconProps?: ViewportIconButtonStyleProps["iconProps"] & Partial<IconProps>;
};

export type ViewportIconButtonProps = Props & ViewportIconButtonThemeStyleProps;

export const defaultStyleProps: ViewportIconButtonThemeStyleProps = {
	...ViewportIconButtonDefaultStyleProps,
};

export type ViewportIconButtonThemePropsType =
	Partial<ViewportIconButtonThemeStyleProps>;

export function ViewportIconButtonThemeProps(
	props: ViewportIconButtonThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

// regex to check if the iconType only contain lowercase letters, numbers and dashes
// or a single number (to allow using numbers as text icons)
const iconRegex = new RegExp("^(?:[a-z0-9-:]|[a-z0-9-:]*[a-z-:][a-z0-9-:]*)$");

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
		<TooltipWrapper {...tooltipWrapperProps} label={label ?? ""}>
			<ActionIcon
				onClick={onClick}
				onMouseDown={onMouseDown}
				disabled={disabled}
				variant={disabled ? variantDisabled : variant}
				aria-label={label ?? undefined}
				className={classes.ViewportIcon}
				{...restActionIconProps}
				style={{...restActionIconProps.style, ...styles}}
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
