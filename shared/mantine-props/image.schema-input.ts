import type {MantineCssLength} from "./primitives.schema-input";
import type {MantineSpacing} from "./spacing.schema-input";

/**
 * Serializable subset of Mantine `Image` props for theme `defaultProps`.
 * @see https://mantine.dev/core/image/
 * @strict
 */
export interface MantineImageProps {
	fit?: string;
	fallbackSrc?: string;
	h?: MantineCssLength;
	w?: MantineCssLength;
	radius?: MantineSpacing;
	mah?: MantineCssLength;
	maw?: MantineCssLength;
}
