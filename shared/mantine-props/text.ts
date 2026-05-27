export type MantineSpacing = "xs" | "sm" | "md" | "lg" | "xl" | string | number;

/**
 * Serializable subset of Mantine `Text` props for settings theme `defaultProps`.
 * @see https://mantine.dev/core/text/
 * @strict
 */
export interface MantineTextProps {
	fw?: string | number;
	size?: MantineSpacing;
}
