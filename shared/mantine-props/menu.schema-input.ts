import type {MantineFloatingPosition} from "./primitives.schema-input";

/**
 * Serializable subset of Mantine `Menu` props for theme `defaultProps`.
 * @strict
 */
export interface MantineMenuProps {
	shadow?: string;
	position?: MantineFloatingPosition;
}
