/**
 * Whether the current selection draft is sent to the model.
 *
 * A click commits only when the selection accepts itself (the maximum is
 * filled, or the parameter is a single selection). A selection action
 * commits whenever the result is a selection the parameter accepts, so
 * "select only this box" customizes the same way "select all" does.
 */
export function shouldSubmitSelectionChange({
	fromAction,
	acceptable,
	acceptImmediately,
	pending,
}: {
	fromAction: boolean;
	acceptable: boolean;
	acceptImmediately: boolean;
	pending: boolean;
}): boolean {
	if (!pending) return false;
	if (fromAction) return acceptable;

	return acceptImmediately;
}

/**
 * A draft is registered as pending only when it waits for Confirm.
 * A selection that is sent on this render must not put the other
 * selection parameters into confirmation mode for that frame. That
 * includes an action whose result the parameter accepts, even when
 * the result does not fill the maximum.
 */
export function registersPendingSelection({
	hasPendingSelection,
	acceptsAutomatically,
	fromAction,
	acceptable,
	cleared,
}: {
	hasPendingSelection: boolean;
	acceptsAutomatically: boolean;
	fromAction: boolean;
	acceptable: boolean;
	cleared: boolean;
}): boolean {
	const actionSubmits =
		fromAction && acceptable && (hasPendingSelection || cleared);

	return hasPendingSelection && !acceptsAutomatically && !actionSubmits;
}

/**
 * The action flag is cleared when the selection is sent, and the committed
 * value can arrive a render later. Hold that selection until the committed
 * value catches up, or until the draft changes, so it is not registered as
 * pending in the gap.
 */
export function nextActionPendingHold(
	heldKey: string | null,
	{
		fromAction,
		acceptable,
		hasPendingSelection,
		cleared,
		selectionKey,
	}: {
		fromAction: boolean;
		acceptable: boolean;
		hasPendingSelection: boolean;
		cleared: boolean;
		selectionKey: string;
	},
): {heldKey: string | null; suppress: boolean} {
	const pending = hasPendingSelection || cleared;
	if (fromAction && acceptable && pending)
		return {heldKey: selectionKey, suppress: hasPendingSelection};
	if (heldKey === selectionKey && hasPendingSelection)
		return {heldKey, suppress: true};

	return {heldKey: null, suppress: false};
}
