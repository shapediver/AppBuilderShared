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
