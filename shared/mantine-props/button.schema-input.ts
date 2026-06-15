import type {MantineSizeToken, MantineSpacing} from "./spacing.schema-input";
import type {
	MantineCssStyleRecord,
	MantineResponsiveCssSize,
} from "./primitives.schema-input";

/**
 * Serializable subset of Mantine `Button` props for settings theme `defaultProps`.
 * @see https://mantine.dev/core/button/
 * @strict
 */
export interface MantineButtonProps {
	fw?: string | number;
	mt?: MantineSpacing;
	ml?: MantineSpacing;
	px?: MantineSpacing;
	fz?: MantineResponsiveCssSize;
	h?: MantineResponsiveCssSize;
	variant?: string;
	size?: MantineSizeToken;
	fullWidth?: boolean;
	justify?: string;
	disabled?: boolean;
	style?: MantineCssStyleRecord;
}
