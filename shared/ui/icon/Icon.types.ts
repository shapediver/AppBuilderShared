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

/**
 * AppBuilder icon props (Iconify + theme defaults via `useProps("Icon", …)`).
 *
 * @docAttached
 * @configPath themeOverrides.components.Icon.defaultProps
 * @displayName Icon
 */
export interface IconProps extends Omit<IconifyIconProps, "icon"> {
	iconType: IconType;
	/**
	 * Mantine size token or CSS length.
	 * @default "1.5rem" (via theme defaultProps)
	 */
	size?: MantineSize | number | string;
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
