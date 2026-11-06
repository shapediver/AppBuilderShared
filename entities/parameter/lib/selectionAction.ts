/**
 * The selection after a "selection" action.
 *
 * Nodes targeted by `selectMatches` are selected, including a node targeted
 * by both lists. Nodes targeted only by `deselectMatches` are deselected.
 * Other selected nodes stay selected. If more nodes match `selectMatches`
 * than `maximumSelection` allows, the first matches in `candidateNames`
 * (scene order) are selected and `exceededBy` counts the rest. When the
 * resulting set equals the current selection, `names` keeps that selection
 * and its order, and `changed` is false.
 */
export function resolveSelectionActionChange(
	candidateNames: readonly string[],
	selectedNames: readonly string[],
	selectMatches: ReadonlySet<string>,
	deselectMatches: ReadonlySet<string>,
	maximumSelection: number,
): {names: string[]; changed: boolean; exceededBy: number} {
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
