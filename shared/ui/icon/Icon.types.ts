import {mantineSpacingSchema} from "@AppBuilderLib/shared/mantine-props/spacing";
import {
	IconifyIcon as IconifyIconDefinition,
	IconProps as IconifyIconProps,
} from "@iconify/react";
import {MantineSize} from "@mantine/core";
import {CSSProperties} from "react";
import {z} from "zod";

export interface CustomCSSProperties extends CSSProperties {
	"--icon-stroke-width"?: string | number;
}

export type IconType = IconifyIconDefinition | string;

/** AppBuilder icon props (Iconify + theme defaults via `useProps("Icon", …)`). */
export interface IconProps extends Omit<IconifyIconProps, "icon"> {
	iconType: IconType;
	size?: MantineSize | number | string;
}

export const sizeMap: Record<string, string> = {
	xs: "0.75rem",
	sm: "0.875rem",
	md: "1rem",
	lg: "1.125rem",
	xl: "1.25rem",
};

/**
 * Single source of truth for Icon theme `defaultProps` (Mantine theme + settings JSON validation).
 * Keys must stay aligned with `useProps("Icon", …)`.
 */
export const IconThemeDefaultPropsSchema = z.strictObject({
	size: mantineSpacingSchema.optional(),
	stroke: z.string().optional(),
});

/**
 * Theme `defaultProps` for `useProps("Icon", …)`.
 * Doc surface matches `MantineIconProps` mirror; Zod validates `size` and `stroke` only.
 *
 * @docAttached
 * @category shared
 * @configPath themeOverrides.components.Icon.defaultProps
 * @displayName Icon
 */
export interface IconThemeDefaultProps extends z.infer<
	typeof IconThemeDefaultPropsSchema
> {
	/**
	 * Mantine size token or CSS length.
	 * @default "1.5rem"
	 */
	size?: MantineSize | number | string;
	/**
	 * Icon stroke width (CSS length).
	 * @default "1px"
	 */
	stroke?: string;
}

/** Defaults passed to `useProps`; validated so drift vs schema fails in tests/runtime. */
export const iconThemeDefaultStyleProps: IconThemeDefaultProps =
	IconThemeDefaultPropsSchema.parse({
		size: "1.5rem",
		stroke: "1px",
	});
