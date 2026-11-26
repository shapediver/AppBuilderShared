/**
 * The name filter `useSelection` uses for a gumball or a rectangle transform:
 * the parameter's own filter, then each object's filter.
 */
export function combinedSelectionNameFilter(
	nameFilter: readonly string[] | undefined,
	objects: readonly {nameFilter: string}[] | undefined,
): string[] {
	return [
		...(nameFilter ?? []),
		...(objects?.map((object) => object.nameFilter) ?? []),
	];
}
