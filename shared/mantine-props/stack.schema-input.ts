import type {MantineSpacing} from "./spacing.schema-input";

/**
 * Serializable subset of Mantine `Stack` props for settings theme `defaultProps`.
 * @see https://mantine.dev/core/stack/
 * @strict
 */
export interface MantineStackProps {
	gap?: MantineSpacing;
	p?: MantineSpacing;
	align?: string;
	justify?: string;
}
