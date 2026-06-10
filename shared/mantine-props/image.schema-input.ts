import type {MantineCssLength} from "./primitives.schema-input";

/** Serializable subset of Mantine `Image` props for theme `defaultProps`. */
export interface MantineImageProps {
	fit?: string;
	fallbackSrc?: string;
	h?: MantineCssLength;
	w?: MantineCssLength;
}
