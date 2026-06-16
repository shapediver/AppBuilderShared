import type {MantineFloatingPosition} from "./primitives.schema-input";
import type {MantineSpacing} from "./spacing.schema-input";

/**
 * Serializable subset of Mantine `Tooltip` props for settings theme `defaultProps`.
 * `label` is string-only (no ReactNode) for JSON theme configs.
 * @see https://mantine.dev/core/tooltip/
 * @strict
 */
export interface MantineTooltipProps {
	label?: string;
	/** Show tooltip arrow (standard Mantine Tooltip) (Mantine default: `true`) */
	withArrow?: boolean;
	position?: MantineFloatingPosition;
	withinPortal?: boolean;
	color?: string;
	radius?: MantineSpacing;
	multiline?: boolean;
	zIndex?: number;
}
