import type {MantineCssStyleRecord} from "./primitives.schema-input";
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
	style?: MantineCssStyleRecord;
}
