/**
 * Whether the current selection draft is sent to the model.
 *
 * A click and a selection action use the same rule. The draft is sent when
 * the selection accepts itself (the maximum is filled, or the parameter is
 * a single selection). An acceptable result that does not fill the maximum
 * stays pending, for an action as well as for a click. Root selection slots
 * are not a parameter, so they never send one.
 */
export function shouldSubmitSelectionChange({
	acceptImmediately,
	pending,
}: {
	acceptImmediately: boolean;
	pending: boolean;
}): boolean {
	if (!pending) return false;

	return acceptImmediately;
}

/**
 * A draft is registered as pending only when it waits for Confirm.
 * A selection that is sent on this render must not put the other
 * selection parameters into confirmation mode for that frame. An action
 * that does not accept itself waits for Confirm, the same as a click.
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
 * Continues a hold that was recorded when the value was actually sent.
 * An acceptable action does not start the hold by itself: the send can
 * still be skipped because another selection is waiting.
 */
export function nextActionPendingHold(
	heldKey: string | null,
	{
		hasPendingSelection,
		selectionKey,
	}: {
		hasPendingSelection: boolean;
		selectionKey: string;
	},
): {heldKey: string | null; suppress: boolean} {
	if (heldKey === selectionKey && hasPendingSelection)
		return {heldKey, suppress: true};

	return {heldKey: null, suppress: false};
}

/**
 * An action whose send was skipped because another draft is waiting is
 * tried again once that draft is gone, and only while the names are the
 * ones that were skipped.
 */
export function shouldRetryBlockedAction({
	blockedKey,
	selectionKey,
	otherPending,
}: {
	blockedKey: string | null;
	selectionKey: string;
	otherPending: boolean;
}): boolean {
	return blockedKey !== null && blockedKey === selectionKey && !otherPending;
}

/**
 * A blocked action stays out of the pending set. Registering it would stop
 * the draft that is already waiting from confirming, so neither one could send.
 */
export function blockedActionStaysUnregistered(
	blockedKey: string | null,
	selectionKey: string,
): boolean {
	return blockedKey !== null && blockedKey === selectionKey;
}
