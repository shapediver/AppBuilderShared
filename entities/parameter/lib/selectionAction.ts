/**
 * The selection after a "selection" action.
 *
 * Nodes targeted by `selectMatches` are selected, including a node targeted
 * by both lists. Nodes targeted only by `deselectMatches` are deselected,
 * except a removal that would drop a non-empty selection below
 * `minimumSelection` (the same refusal as a click). A maximum of 1 replaces
 * the selection. A greater maximum adds matches until it is full and does
 * not drop a node this action did not deselect. If more matches remain than
 * that room, the first of them in `candidateNames` (scene order) are
 * selected and `exceededBy` counts the rest. When the resulting set equals
 * the current selection, `names` keeps that selection and its order, and
 * `changed` is false.
 */
export function resolveSelectionActionChange(
	candidateNames: readonly string[],
	selectedNames: readonly string[],
	selectMatches: ReadonlySet<string>,
	deselectMatches: ReadonlySet<string>,
	maximumSelection: number,
	minimumSelection = 0,
): {names: string[]; changed: boolean; exceededBy: number} {
	const maximum = Number.isFinite(maximumSelection)
		? Math.max(0, maximumSelection)
		: Number.POSITIVE_INFINITY;
	const minimum = Math.max(0, minimumSelection);
	const targeted = Array.from(
		new Set(candidateNames.filter((name) => selectMatches.has(name))),
	);
	const deselectOnly = new Set(
		Array.from(deselectMatches).filter((name) => !selectMatches.has(name)),
	);
	let kept = [...selectedNames];
	for (const name of selectedNames) {
		if (!deselectOnly.has(name)) continue;
		const next = kept.filter((item) => item !== name);
		// A click refuses this one deselection and leaves the node selected.
		if (kept.length > 0 && next.length < minimum) continue;
		kept = next;
	}

	const replaces = maximum === 1 && targeted.length > 0;
	const room =
		maximum === Number.POSITIVE_INFINITY
			? Number.POSITIVE_INFINITY
			: Math.max(0, maximum - kept.length);
	const additions = targeted.filter((name) => !kept.includes(name));
	const names = replaces
		? [targeted[0]]
		: [...kept, ...additions.slice(0, room)];
	const selectedMatches = names.filter((name) => targeted.includes(name));
	const changed =
		names.length !== selectedNames.length ||
		!names.every((name) => selectedNames.includes(name));

	return {
		names: changed ? names : [...selectedNames],
		changed,
		exceededBy: targeted.length - selectedMatches.length,
	};
}
