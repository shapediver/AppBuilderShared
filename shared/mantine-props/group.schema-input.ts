import type {MantineSpacing} from "./spacing.schema-input";
import type {
	MantineCssLength,
	MantineCssStyleRecord,
	MantineFlexWrap,
	MantineStylesApi,
} from "./primitives.schema-input";

/**
 * Serializable subset of Mantine `Group` props for settings theme `defaultProps`.
 * @see https://mantine.dev/core/group/
 * @strict
 */
export interface MantineGroupProps {
	/** Group width (Mantine default: `"100%"`) */
	w?: MantineCssLength;
	/** Group height (Mantine default: `"100%"`) */
	h?: MantineCssLength;
	/** Flex justify-content (Mantine default: `"center"`) */
	justify?: string;
	/** Flex align-items */
	align?: string;
	/** Gap between children (Mantine spacing) */
	gap?: MantineSpacing;
	/** Flex wrap (Mantine default: `"nowrap"`) */
	wrap?: MantineFlexWrap;
	/** Padding — Mantine spacing (Mantine default: `"xs"`) */
	p?: MantineSpacing;
	/** Padding top */
	pt?: MantineSpacing;
	/** Padding bottom */
	pb?: MantineSpacing;
	/** Margin bottom (Mantine spacing) */
	mb?: MantineSpacing;
	style?: MantineCssStyleRecord;
	styles?: MantineStylesApi;
}
