import type {MantineStylesApi} from "./primitives.schema-input";

/**
 * Serializable subset of Mantine `Card` props for theme `defaultProps`.
 * @see https://mantine.dev/core/card/
 * @strict
 */
export interface MantineCardProps {
	styles?: MantineStylesApi;
}
