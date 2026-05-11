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

/**
 * Single source of truth for Icon theme `defaultProps` (Mantine theme + settings JSON validation).
 * Keys must stay aligned with `useProps("Icon", …)`.
 */
export const IconThemeDefaultPropsSchema = z.strictObject({
	size: z.union([z.string(), z.number()]).optional(),
	stroke: z.string().optional(),
});

export type IconThemeDefaultProps = z.infer<typeof IconThemeDefaultPropsSchema>;

/** Defaults passed to `useProps`; validated so drift vs schema fails in tests/runtime. */
export const iconThemeDefaultStyleProps: IconThemeDefaultProps =
	IconThemeDefaultPropsSchema.parse({
		size: "1.5rem",
		stroke: "1px",
	});
