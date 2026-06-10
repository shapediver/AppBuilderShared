import {
	IconifyIcon as IconifyIconDefinition,
	IconProps as IconifyIconProps,
} from "@iconify/react";
import {mantineSpacingSchema} from "@AppBuilderLib/shared/mantine-props/spacing";
import {MantineSize} from "@mantine/core";
import {CSSProperties} from "react";
import {z} from "zod";

export interface CustomCSSProperties extends CSSProperties {
	"--icon-stroke-width"?: string | number;
}

export type IconType = IconifyIconDefinition | string;

/**
 * AppBuilder icon props (Iconify + theme defaults via `useProps("Icon", …)`).
 *
 * @docAttached
 * @category shared
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

/**
 * Single source of truth for Icon theme `defaultProps` (Mantine theme + settings JSON validation).
 * Keys must stay aligned with `useProps("Icon", …)`.
 */
export const IconThemeDefaultPropsSchema = z.strictObject({
	size: mantineSpacingSchema.optional(),
	stroke: z.string().optional(),
});

/** TypeDoc surface for `useProps("Icon", …)` theme defaults (schema is JSON source of truth). */
export interface IconThemeDefaultProps
	extends z.infer<typeof IconThemeDefaultPropsSchema> {}

/** Defaults passed to `useProps`; validated so drift vs schema fails in tests/runtime. */
export const iconThemeDefaultStyleProps: IconThemeDefaultProps =
	IconThemeDefaultPropsSchema.parse({
		size: "1.5rem",
		stroke: "1px",
	});
