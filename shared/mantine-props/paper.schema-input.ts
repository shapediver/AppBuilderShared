import type {MantineSpacing} from "./spacing.schema-input";

/**
 * Serializable subset of Mantine `Paper` props for settings theme `defaultProps`.
 * @see https://mantine.dev/core/paper/
 * @strict
 */
export interface MantinePaperProps {
	withBorder?: boolean;
	shadow?: string;
	px?: MantineSpacing;
	py?: MantineSpacing;
	style?: Record<string, string | number>;
}
