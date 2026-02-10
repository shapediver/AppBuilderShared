import {
	IconifyIcon as IconifyIconDefinition,
	IconProps as IconifyIconProps,
} from "@iconify/react";
import {MantineSize} from "@mantine/core";
import {CSSProperties} from "react";

export interface CustomCSSProperties extends CSSProperties {
	"--icon-stroke-width"?: string | number;
}

export type IconType = IconifyIconDefinition | string;

export interface IconProps extends Omit<IconifyIconProps, "icon"> {
	iconType: IconType;
	size?: MantineSize | number | string; // MantineSize or CSS size value
}

export const sizeMap: Record<string, string> = {
	xs: "0.75rem",
	sm: "0.875rem",
	md: "1rem",
	lg: "1.125rem",
	xl: "1.25rem",
};
export const defaultStyleProps: Partial<IconProps> = {
	size: "1.5rem",
	stroke: "1px",
};
export type IconThemePropsType = Partial<IconProps>;
