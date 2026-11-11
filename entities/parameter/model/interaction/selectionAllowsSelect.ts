/**
 * Whether a selection group's maximum admits selecting nodes.
 *
 * Omitted means 1. A value below 1 selects nothing; hover still follows
 * `hover` independently.
 */
export const selectionAllowsSelect = (maximumSelection?: number): boolean =>
	(maximumSelection ?? 1) >= 1;
