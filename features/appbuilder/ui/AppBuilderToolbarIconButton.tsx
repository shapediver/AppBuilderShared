import type {MantineActionIconProps} from "@AppBuilderLib/shared/mantine-props/actionIcon";
import type {MantineTooltipProps} from "@AppBuilderLib/shared/mantine-props/tooltip";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import {IconProps, IconType} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import TooltipWrapper from "@AppBuilderLib/shared/ui/tooltip/TooltipWrapper";
import {
	ActionIcon,
	Box,
	MantineStyleProp,
	MantineThemeComponent,
	useProps,
} from "@mantine/core";
import React, {forwardRef} from "react";
import classes from "./AppBuilderToolbarIconButton.module.css";

interface Props {
	label: string;
	tooltipLabel?: string;
	iconType: IconType;
	disabled?: boolean;
	loading?: boolean;
	styles?: MantineStyleProp;
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
	onMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
}

export type AppBuilderToolbarIconButtonStyleProps = {
	actionIconProps?: MantineActionIconProps & {variantDisabled?: string};
	iconProps?: {color?: string; colorDisabled?: string};
};

/**
 * Theme defaults for App Builder toolbar icon triggers.
 *
 * `ViewportIconButton` remains supported as a legacy theme override key and is
 * applied as a fallback before `AppBuilderToolbarIconButton` defaults.
 *
 * @docAttached
 * @category appbuilder
 * @configPath themeOverrides.components.AppBuilderToolbarIconButton.defaultProps
 * @displayName AppBuilderToolbarIconButton
 */
export type AppBuilderToolbarIconButtonThemeStyleProps =
	AppBuilderToolbarIconButtonStyleProps & {
		tooltipWrapperProps?: MantineTooltipProps;
		iconProps?: AppBuilderToolbarIconButtonStyleProps["iconProps"] &
			Partial<IconProps>;
	};

export type AppBuilderToolbarIconButtonProps = Props &
	AppBuilderToolbarIconButtonThemeStyleProps;

export const AppBuilderToolbarIconButtonDefaultStyleProps: AppBuilderToolbarIconButtonStyleProps =
	{
		actionIconProps: {
			size: 32,
			variant: "subtle",
			variantDisabled: "transparent",
			style: {
				margin: "0",
			},
		},
		iconProps: {
			color: "var(--mantine-color-default-color)",
			colorDisabled: "var(--mantine-color-disabled-color)",
		},
	};

export const defaultStyleProps: AppBuilderToolbarIconButtonThemeStyleProps = {
	...AppBuilderToolbarIconButtonDefaultStyleProps,
};

export type AppBuilderToolbarIconButtonThemePropsType =
	Partial<AppBuilderToolbarIconButtonThemeStyleProps>;

export function AppBuilderToolbarIconButtonThemeProps(
	props: AppBuilderToolbarIconButtonThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export function useResolvedAppBuilderToolbarIconButtonTheme(
	props: AppBuilderToolbarIconButtonThemePropsType = {},
): AppBuilderToolbarIconButtonThemeStyleProps {
	// Thin compatibility layer: legacy `ViewportIconButton` theme overrides still
	// apply, but the current component key is `AppBuilderToolbarIconButton`.
	const legacyThemeProps = useProps(
		"ViewportIconButton",
		defaultStyleProps,
		{},
	) as AppBuilderToolbarIconButtonThemeStyleProps;

	return useProps(
		"AppBuilderToolbarIconButton",
		legacyThemeProps,
		props,
	) as AppBuilderToolbarIconButtonThemeStyleProps;
}

const pickDefined = <T extends Record<string, unknown>, K extends keyof T>(
	source: T | undefined,
	keys: readonly K[],
): Partial<Pick<T, K>> => {
	if (!source) return {};

	return keys.reduce<Partial<Pick<T, K>>>((result, key) => {
		if (source[key] !== undefined) {
			result[key] = source[key];
		}
		return result;
	}, {});
};

// Regex to check whether the iconType only contains lowercase letters,
// numbers, dashes and colons, or is a single number (to allow numeric text icons).
const iconRegex = new RegExp("^(?:[a-z0-9-:]|[a-z0-9-:]*[a-z-:][a-z0-9-:]*)$");

const AppBuilderToolbarIconButton = forwardRef<
	HTMLButtonElement,
	Props & AppBuilderToolbarIconButtonThemePropsType
>(function AppBuilderToolbarIconButton(props, ref) {
	const {
		label,
		tooltipLabel,
		iconType,
		disabled = false,
		loading = false,
		styles,
		onClick,
		onMouseDown,
		...rest
	} = props;

	const {tooltipWrapperProps, actionIconProps, iconProps} =
		useResolvedAppBuilderToolbarIconButtonTheme(rest);

	const actionIconStyleProps = pickDefined(actionIconProps, [
		"color",
		"size",
		"style",
		"styles",
		"loaderProps",
		"variant",
		"variantDisabled",
	] as const);
	const {variant, variantDisabled, ...restActionIconProps} = {
		...defaultStyleProps.actionIconProps,
		...actionIconStyleProps,
	};
	const {color, colorDisabled, ...restIconProps} = {
		...defaultStyleProps.iconProps,
		...iconProps,
	};

	const isIcon = typeof iconType !== "string" || iconRegex.test(iconType);

	return (
		<TooltipWrapper
			{...tooltipWrapperProps}
			label={tooltipLabel ?? label ?? ""}
		>
			<ActionIcon
				ref={ref}
				onClick={onClick}
				onMouseDown={onMouseDown}
				disabled={disabled}
				loading={loading}
				variant={disabled ? variantDisabled : variant}
				aria-label={label ?? undefined}
				className={classes.toolbarIcon}
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
						{typeof iconType === "string" &&
						iconType.startsWith("SD_")
							? iconType.substring(3)
							: iconType}
					</Box>
				)}
			</ActionIcon>
		</TooltipWrapper>
	);
});

export default AppBuilderToolbarIconButton;
