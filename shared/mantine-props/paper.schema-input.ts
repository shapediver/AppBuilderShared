import type {
	MantineCssStyleRecord,
	MantineStylesApi,
} from "./primitives.schema-input";
import type {MantineSpacing} from "./spacing.schema-input";

/**
 * Serializable subset of Mantine `Paper` props for settings theme `defaultProps`.
 * @see https://mantine.dev/core/paper/
 * @strict
 */
export interface MantinePaperProps {
	withBorder?: boolean;
	shadow?: string;
	/** Padding on all sides (Mantine spacing) */
	p?: MantineSpacing;
	px?: MantineSpacing;
	py?: MantineSpacing;
	style?: MantineCssStyleRecord;
	styles?: MantineStylesApi;
}
