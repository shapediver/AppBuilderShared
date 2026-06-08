import type {MantineSizeToken} from "./spacing.schema-input";

/**
 * Serializable subset of Mantine `Text` props for settings theme `defaultProps`.
 * @see https://mantine.dev/core/text/
 * @strict
 */
export interface MantineTextProps {
	fw?: string | number;
	size?: MantineSizeToken;
	c?: string;
}
