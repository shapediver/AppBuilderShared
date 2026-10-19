/**
 * Whether a selection parameter should contribute Confirm/Cancel toolbar
 * commands.
 *
 * Single selections (`1/1` or optional `0/1`) auto-commit and must not show
 * those commands unless this parameter itself has a draft that cannot be
 * accepted automatically. A sibling pending selection blocks auto-commit; in
 * that case Confirm/Cancel appear only once this draft also needs a
 * confirmation. Showing them for a sibling alone produced disabled buttons
 * that desktop hides with the viewport toolbar, but mobile always keeps the
 * toolbar visible.
 */
export const shouldShowSelectionConfirmationControls = ({
	hasOtherPendingSelection,
	hasPendingSelection,
	effectiveSelectionActive,
	acceptImmediately,
	minimumSelection,
	maximumSelection,
}: {
	hasOtherPendingSelection: boolean;
	hasPendingSelection: boolean;
	effectiveSelectionActive: boolean;
	acceptImmediately: boolean;
	minimumSelection: number;
	maximumSelection: number;
}): boolean => {
	const hasAutomaticSelectionControls = !(
		(minimumSelection === 1 && maximumSelection === 1) ||
		(minimumSelection === 0 && maximumSelection === 1)
	);

	return (
		(effectiveSelectionActive || hasPendingSelection) &&
		!acceptImmediately &&
		(hasAutomaticSelectionControls ||
			(hasPendingSelection &&
				(minimumSelection === 0 || hasOtherPendingSelection)))
	);
};
