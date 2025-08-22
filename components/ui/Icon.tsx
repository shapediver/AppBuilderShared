import {
	Icon as IconifyIconComponent,
	IconifyIcon as IconifyIconDefinition,
	IconProps as IconifyIconProps,
	loadIcons,
} from "@iconify/react";
import {
	MantineSize,
	MantineThemeComponent,
	parseThemeColor,
	useMantineTheme,
	useProps,
} from "@mantine/core";
import React, {CSSProperties, forwardRef, useMemo} from "react";
import classes from "./Icon.module.css";

// List of all Tabler icons used in the app for preloading
// Icons don't have to be pre-loaded, we just do it for the ones we know that are used
const PRELOAD_ICONS = [
	"tabler:adjustments-horizontal",
	"tabler:alert-circle",
	"tabler:arrow-back-up",
	"tabler:arrow-forward-up",
	"tabler:augmented-reality",
	"tabler:bookmark",
	"tabler:bookmark-off",
	"tabler:check",
	"tabler:chevron-down",
	"tabler:chevron-left",
	"tabler:chevron-right",
	"tabler:chevron-up",
	"tabler:circle-off",
	"tabler:copy",
	"tabler:device-desktop",
	"tabler:device-desktop-down",
	"tabler:device-desktop-up",
	"tabler:device-floppy",
	"tabler:dots-vertical",
	"tabler:download",
	"tabler:eye",
	"tabler:eye-off",
	"tabler:grid-dots",
	"tabler:hand-finger",
	"tabler:info-circle",
	"tabler:info-circle-filled",
	"tabler:lock-square",
	"tabler:mail-forward",
	"tabler:maximize",
	"tabler:moon-stars",
	"tabler:network",
	"tabler:network-off",
	"tabler:paperclip",
	"tabler:pencil",
	"tabler:refresh",
	"tabler:robot",
	"tabler:shopping-cart-plus",
	"tabler:sun",
	"tabler:tags",
	"tabler:thumb-down",
	"tabler:thumb-up",
	"tabler:upload",
	"tabler:user",
	"tabler:user-check",
	"tabler:user-question",
	"tabler:users-group",
	"tabler:video",
	"tabler:world",
	"tabler:x",
	"tabler:zoom-in",
];
loadIcons(PRELOAD_ICONS);

interface CustomCSSProperties extends CSSProperties {
	"--icon-stroke-width"?: string | number;
}
export type IconType = IconifyIconDefinition | string;

export interface IconProps extends Omit<IconifyIconProps, "icon"> {
	iconType: IconType;
	size?: MantineSize | number | string; // MantineSize or CSS size value
}

const defaultStyleProps: Partial<IconProps> = {
	size: "1.5rem",
	stroke: "1px",
};

type IconThemePropsType = Partial<IconProps>;

export function IconThemeProps(
	props: IconThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export function useIconProps(props: Partial<IconProps>): Partial<IconProps> {
	return useProps("Icon", defaultStyleProps, props);
}

// Helper function to convert icon name to proper import name
const getIconImportName = (iconName: string): string => {
	// Handle special cases first
	// These are needed to have full backwards compatibility
	const specialCases: Record<string, string> = {
		"icon-hand-finger": "hand-finger",
		"icon-info-circle-filled": "info-circle-filled",
		"paper-clip": "paperclip", // lowercase 'c'
	};

	if (specialCases[iconName]) {
		return `tabler:${specialCases[iconName]}`;
	}

	// check if the name has "tabler:" prefix
	if (iconName.startsWith("tabler:")) {
		return iconName;
	} else {
		return `tabler:${iconName}`;
	}
};

const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
	{iconType, ...rest}: IconProps,
	ref,
) {
	const theme = useMantineTheme();

	const {color, size, stroke, ...iconPropsStyle} = useIconProps(rest);
	const parsedColor = useMemo(() => {
		return color ? parseThemeColor({color, theme}).value : color;
	}, [color, theme]);

	const iconProps = useMemo(
		() => ({
			...iconPropsStyle,
			ref,
			color: parsedColor,
			...rest,
		}),
		[iconPropsStyle, ref, parsedColor, rest],
	);

	// convert the mantine size prop to a CSS value
	const cssSize = useMemo(() => {
		return size
			? typeof size === "number"
				? `${size}px`
				: `${size}`
			: undefined;
	}, [size]);

	if (typeof iconType === "string") {
		const iconImportName = getIconImportName(iconType);
		return (
			<IconifyIconComponent
				icon={iconImportName}
				{...iconProps}
				className={classes.tablerIconify}
				width={cssSize}
				style={
					{
						...iconProps.style,
						// Apply stroke width as a CSS variable
						// Which is used in the icon's CSS
						"--icon-stroke-width": stroke,
					} as CustomCSSProperties
				}
			/>
		);
	} else {
		return (
			<IconifyIconComponent
				icon={iconType}
				{...iconProps}
				className={classes.tablerIconify}
				width={cssSize}
				style={
					{
						...iconProps.style,
						// Apply stroke width as a CSS variable
						// Which is used in the icon's CSS
						"--icon-stroke-width": stroke,
					} as CustomCSSProperties
				}
			/>
		);
	}
});

export default Icon;
