/**
 * Whether a selection maximum can hold a node.
 *
 * A maximum below 1 selects nothing. Hover is a separate manager, so a
 * hover-only group sets `maximumSelection` to 0 and still hovers.
 */
export function selectionMaximumAdmitsNodes(
	maximumSelection: number | undefined,
): boolean {
	return (maximumSelection ?? 1) >= 1;
}
