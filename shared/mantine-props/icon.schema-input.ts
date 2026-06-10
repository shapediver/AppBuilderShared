import type {MantineSpacing} from "./spacing.schema-input";

/**
 * Serializable AppBuilder `Icon` props (Iconify-based; not `@mantine/core` Icon).
 * Theme keys align with `IconThemeDefaultPropsSchema`; `iconType` / `color` are runtime defaults.
 */
export interface MantineIconProps {
	iconType?: string;
	color?: string;
	colorDisabled?: string;
	size?: MantineSpacing;
	stroke?: string;
}
