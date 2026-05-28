/** Aligns with `MantineSpacing` in `./spacing.schema-input.ts` (inlined for per-file ts-to-zod). */
export type MantineSpacing = "xs" | "sm" | "md" | "lg" | "xl" | string | number;

/**
 * Serializable subset of Mantine `Tooltip` props for settings theme `defaultProps`.
 * `label` is string-only (no ReactNode) for JSON theme configs.
 * @see https://mantine.dev/core/tooltip/
 * @strict
 */
export interface MantineTooltipProps {
	label?: string;
	withArrow?: boolean;
	position?: string;
	withinPortal?: boolean;
	color?: string;
	radius?: MantineSpacing;
	multiline?: boolean;
	zIndex?: number;
}
