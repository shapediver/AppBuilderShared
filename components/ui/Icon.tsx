import {
	Icon as IconifyIconComponent,
	IconifyIcon as IconifyIconDefinition,
	IconProps as IconifyIconProps,
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
