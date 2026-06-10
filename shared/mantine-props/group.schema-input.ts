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
	/**
	 * Group width
	 * @default "100%"
	 */
	w?: MantineCssLength;
	/**
	 * Group height
	 * @default "100%"
	 */
	h?: MantineCssLength;
	/**
	 * Flex justify-content
	 * @default "center"
	 */
	justify?: string;
	/**
	 * Flex wrap
	 * @default "nowrap"
	 */
	wrap?: MantineFlexWrap;
	/**
	 * Padding (Mantine spacing)
	 * @default "xs"
	 */
	p?: MantineSpacing;
	pt?: MantineSpacing;
	pb?: MantineSpacing;
	styles?: MantineStylesApi;
}
