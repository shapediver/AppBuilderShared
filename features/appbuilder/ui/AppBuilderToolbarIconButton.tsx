import type {
	AppBuilderToolbarAlign,
	AppBuilderToolbarSide,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {getToolbarIconLabelLayout} from "@AppBuilderLib/features/appbuilder/lib/getToolbarIconLabelLayout";
import type {MantineActionIconProps} from "@AppBuilderLib/shared/mantine-props/actionIcon";
import type {MantineTextProps} from "@AppBuilderLib/shared/mantine-props/text";
import type {MantineTooltipProps} from "@AppBuilderLib/shared/mantine-props/tooltip";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import {IconProps, IconType} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {isIconImageUrl} from "@AppBuilderLib/shared/ui/icon/isIconImageUrl";
import TooltipWrapper from "@AppBuilderLib/shared/ui/tooltip/TooltipWrapper";
import {
	ActionIcon,
	Box,
	MantineStyleProp,
	MantineThemeComponent,
	Text,
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
	labelSide?: AppBuilderToolbarSide;
	labelAlign?: AppBuilderToolbarAlign;
}

export type AppBuilderToolbarIconButtonStyleProps = {
	actionIconProps?: MantineActionIconProps & {variantDisabled?: string};
	iconProps?: {color?: string; colorDisabled?: string};
	labelSide?: AppBuilderToolbarSide;
	labelAlign?: AppBuilderToolbarAlign;
	labelProps?: MantineTextProps;
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
		labelProps: {
			size: "xs",
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

/**
 * Caption rules shared by every icon button.
 * A caption is shown only when `labelSide` is set. The tooltip is dropped when
 * it would repeat that caption, and otherwise falls back to `label`.
 */
export function resolveToolbarIconLabel(args: {
	label: string;
	tooltipLabel?: string;
	labelSide?: AppBuilderToolbarSide;
	labelAlign?: AppBuilderToolbarAlign;
}) {
	const showCaption = Boolean(args.labelSide && args.label);
	const resolvedTooltipLabel =
		showCaption && (!args.tooltipLabel || args.tooltipLabel === args.label)
			? ""
			: (args.tooltipLabel ?? args.label ?? "");

	return {
		showCaption,
		resolvedTooltipLabel,
		ariaLabel: showCaption ? undefined : args.label || undefined,
		layout: args.labelSide
			? getToolbarIconLabelLayout(args.labelSide, args.labelAlign)
			: undefined,
	};
}

function ToolbarIconLabelContent({
	showCaption,
	label,
	icon,
	layout,
	labelProps,
}: {
	showCaption: boolean;
	label: string;
	icon: React.ReactNode;
	layout?: ReturnType<typeof getToolbarIconLabelLayout>;
	labelProps?: MantineTextProps;
}) {
	if (!showCaption || !layout) return icon;

	const {labelFirst, verticalCaption, captionRotate, ...labelLayoutStyle} =
		layout;
	const captionNode = (
		<Text
			component="span"
			{...defaultStyleProps.labelProps}
			{...labelProps}
			className={[
				classes.caption,
				verticalCaption ? classes.captionVertical : undefined,
				captionRotate === 180 ? classes.captionRotate180 : undefined,
			]
				.filter(Boolean)
				.join(" ")}
		>
			{label}
		</Text>
	);

	return (
		<span className={classes.labelLayout} style={labelLayoutStyle}>
			{labelFirst ? (
				<>
					{captionNode}
					{icon}
				</>
			) : (
				<>
					{icon}
					{captionNode}
				</>
			)}
		</span>
	);
}

/**
 * Icon button that keeps the caller's ActionIcon chrome and applies the
 * toolbar caption rules (`AppBuilderToolbarIconButton` `labelSide`).
 */
export function AppBuilderLabeledActionIcon({
	label,
	tooltipLabel,
	icon,
	labelSide: labelSideProp,
	labelAlign: labelAlignProp,
	className,
	style,
	variant,
	size,
	disabled,
	loading,
	onClick,
}: {
	label: string;
	tooltipLabel?: string;
	icon: React.ReactNode;
	labelSide?: AppBuilderToolbarSide;
	labelAlign?: AppBuilderToolbarAlign;
	className?: string;
	style?: MantineStyleProp;
	variant?: string;
	size?: MantineActionIconProps["size"];
	disabled?: boolean;
	loading?: boolean;
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
	const {
		tooltipWrapperProps,
		labelSide: labelSideTheme,
		labelAlign: labelAlignTheme,
		labelProps,
	} = useResolvedAppBuilderToolbarIconButtonTheme();
	const {showCaption, resolvedTooltipLabel, ariaLabel, layout} =
		resolveToolbarIconLabel({
			label,
			tooltipLabel,
			labelSide: labelSideProp ?? labelSideTheme,
			labelAlign: labelAlignProp ?? labelAlignTheme,
		});

	return (
		<TooltipWrapper {...tooltipWrapperProps} label={resolvedTooltipLabel}>
			<ActionIcon
				onClick={onClick}
				disabled={disabled}
				loading={loading}
				variant={variant}
				size={size}
				aria-label={ariaLabel}
				className={
					[
						className,
						showCaption ? classes.toolbarIconLabeled : undefined,
					]
						.filter(Boolean)
						.join(" ") || undefined
				}
				style={style}
				w={showCaption ? "auto" : undefined}
				h={showCaption ? "auto" : undefined}
			>
				<ToolbarIconLabelContent
					showCaption={showCaption}
					label={label}
					icon={icon}
					layout={layout}
					labelProps={labelProps}
				/>
			</ActionIcon>
		</TooltipWrapper>
	);
}

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
		labelSide: labelSideProp,
		labelAlign: labelAlignProp,
		...rest
	} = props;

	const {
		tooltipWrapperProps,
		actionIconProps,
		iconProps,
		labelSide: labelSideTheme,
		labelAlign: labelAlignTheme,
		labelProps,
	} = useResolvedAppBuilderToolbarIconButtonTheme(rest);
	const labelSide = labelSideProp ?? labelSideTheme;
	const labelAlign = labelAlignProp ?? labelAlignTheme;
	const {showCaption, resolvedTooltipLabel, ariaLabel, layout} =
		resolveToolbarIconLabel({
			label,
			tooltipLabel,
			labelSide,
			labelAlign,
		});

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

	const isIcon =
		typeof iconType !== "string" ||
		iconRegex.test(iconType) ||
		isIconImageUrl(iconType);
	const iconNode = isIcon ? (
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
			{typeof iconType === "string" && iconType.startsWith("SD_")
				? iconType.substring(3)
				: iconType}
		</Box>
	);

	return (
		<TooltipWrapper {...tooltipWrapperProps} label={resolvedTooltipLabel}>
			<ActionIcon
				ref={ref}
				onClick={onClick}
				onMouseDown={onMouseDown}
				disabled={disabled}
				loading={loading}
				variant={disabled ? variantDisabled : variant}
				aria-label={ariaLabel}
				className={
					showCaption
						? `${classes.toolbarIcon} ${classes.toolbarIconLabeled}`
						: classes.toolbarIcon
				}
				{...restActionIconProps}
				style={{
					...restActionIconProps.style,
					...styles,
				}}
				w={showCaption ? "auto" : isIcon ? undefined : "100%"}
				h={showCaption ? "auto" : undefined}
			>
				<ToolbarIconLabelContent
					showCaption={showCaption}
					label={label}
					icon={iconNode}
					layout={layout}
					labelProps={labelProps}
				/>
			</ActionIcon>
		</TooltipWrapper>
	);
});

export default AppBuilderToolbarIconButton;
