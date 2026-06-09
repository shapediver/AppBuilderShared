import type {MantineSpacing} from "./spacing.schema-input";
import type {
	MantineCssLength,
	MantineFlexWrap,
	MantineStylesApi,
} from "./primitives.schema-input";

/**
 * Serializable subset of Mantine `Group` props for settings theme `defaultProps`.
 * @see https://mantine.dev/core/group/
 * @strict
 */
export interface MantineGroupProps {
	w?: MantineCssLength;
	h?: MantineCssLength;
	justify?: string;
	wrap?: MantineFlexWrap;
	p?: MantineSpacing;
	pt?: MantineSpacing;
	pb?: MantineSpacing;
	styles?: MantineStylesApi;
}
