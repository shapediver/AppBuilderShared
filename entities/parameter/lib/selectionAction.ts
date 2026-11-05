export type SelectionActionChangeInput = {
	/** Names of the candidate nodes of the parameter, in scene order. */
	candidateNames: readonly string[];
	/** Names of the currently selected nodes. */
	selectedNames: readonly string[];
	/** Names of the candidates targeted by `select`. */
	selectMatches: ReadonlySet<string>;
	/** Names of the candidates targeted by `deselect`. */
	deselectMatches: ReadonlySet<string>;
	/** The `maximumSelection` of the parameter. */
	maximumSelection: number;
};

export type SelectionActionChange = {
	/** The resulting selection. The current selection if nothing changes. */
	names: string[];
	/** Whether the resulting selection differs from the current one. */
	changed: boolean;
	/** Number of nodes targeted by `select` which the maximum cannot hold. */
	exceededBy: number;
};

/**
 * Compute the selection of a parameter after a "selection" action.
 *
 * - Nodes targeted by `select` are selected. A node targeted by both `select`
 *   and `deselect` is selected.
 * - Nodes targeted only by `deselect` are deselected.
 * - Other selected nodes stay selected.
 * - If more nodes match `select` than `maximumSelection` allows, the first
 *   matches in scene order are selected (`exceededBy` reports the rest).
 *   Selected nodes which do not fit next to the new ones are dropped, like a
 *   single selection which is replaced by the next one.
 */
export function resolveSelectionActionChange({
	candidateNames,
	selectedNames,
	selectMatches,
	deselectMatches,
	maximumSelection,
}: SelectionActionChangeInput): SelectionActionChange {
	const maximum = Math.max(0, maximumSelection);
	const targeted = Array.from(
		new Set(candidateNames.filter((name) => selectMatches.has(name))),
	);
	const chosen = targeted.slice(0, maximum);
	const chosenSet = new Set(chosen);
	const retained = selectedNames.filter(
		(name) =>
			!chosenSet.has(name) &&
			(selectMatches.has(name) || !deselectMatches.has(name)),
	);
	const kept = retained.slice(0, Math.max(0, maximum - chosen.length));

	const names = [...kept, ...chosen];
	const changed =
		names.length !== selectedNames.length ||
		!names.every((name) => selectedNames.includes(name));

	return {
		names: changed ? names : [...selectedNames],
		changed,
		exceededBy: targeted.length - chosen.length,
	};
}
