/**
 * Rows the checklist should show as selected: the committed selection
 * intersected with the rows currently on screen.
 */
export function visibleMultiselectValue(
	committed: readonly string[],
	shown: readonly string[],
): string[] {
	const shownSet = new Set(shown);
	return committed.filter((entry) => shownSet.has(entry));
}

/**
 * The widget reports only the visible selection. Rows hidden by the current
 * filters stay on the parameter. A shown row is kept only when `nextVisible`
 * still contains it.
 */
export function mergeFilteredMultiselectValue(
	committed: readonly string[],
	shown: readonly string[],
	nextVisible: readonly string[],
): string[] {
	const shownSet = new Set(shown);
	const kept = committed.filter((entry) => !shownSet.has(entry));
	const visible = nextVisible.filter((entry) => shownSet.has(entry));
	return [...kept, ...visible];
}
