export type MantineSpacing = "xs" | "sm" | "md" | "lg" | "xl" | string | number;

/**
 * Serializable subset of Mantine `Box` props for settings theme `defaultProps`.
 * @see https://mantine.dev/core/box/
 * @strict
 */
export interface MantineBoxProps {
	p?: MantineSpacing;
	px?: MantineSpacing;
	py?: MantineSpacing;
	pb?: MantineSpacing;
	pt?: MantineSpacing;
	m?: MantineSpacing;
	ml?: MantineSpacing;
	mt?: MantineSpacing;
	style?: Record<string, string | number>;
}
