import type {DatabaseTable, FilterSelection} from "./types";

/** One filter group definition (column index + multivalued / multiple UI semantics). */
export type FilterDef = {
	column: number;
	multivalued?: boolean;
	multiple?: boolean;
	type?: "color" | "text";
	filterValues?: string[];
};

/** Reads one cell; multivalued columns split on `;` into separate matchable tokens. */
export function getCellValues(
	row: string[],
	column: number,
	multivalued?: boolean,
): string[] {
	const cell = row[column] ?? "";
	if (multivalued) {
		return cell
			.split(";")
			.map((segment) => segment.trim())
			.filter(Boolean);
	}
	return [cell];
}

/**
 * Unique values shown in a filter group.
 * Uses `filterValues` from settings when provided; otherwise derives from the table column.
 */
export function extractFilterValues(
	table: DatabaseTable,
	filter: FilterDef,
): string[] {
	if (filter.filterValues !== undefined) {
		return [...filter.filterValues].sort((a, b) => a.localeCompare(b));
	}

	const valueSet = new Set<string>();
	for (const row of table.rows) {
		for (const value of getCellValues(
			row,
			filter.column,
			filter.multivalued,
		)) {
			valueSet.add(value);
		}
	}

	return Array.from(valueSet).sort((a, b) => a.localeCompare(b));
}

/**
 * Whether a row matches one filter group.
 * Empty selection passes; tag filters OR within group; text filters use substring match.
 */
export function rowMatchesFilter(
	row: string[],
	filter: FilterDef,
	selected: string[],
): boolean {
	if (selected.length === 0) {
		return true;
	}

	if (filter.type === "text") {
		const query = selected[0]?.trim().toLowerCase() ?? "";
		if (!query) {
			return true;
		}
		return getCellValues(row, filter.column, filter.multivalued).some(
			(cell) => cell.toLowerCase().includes(query),
		);
	}

	const cellValues = getCellValues(row, filter.column, filter.multivalued);
	return selected.some((value) => cellValues.includes(value));
}

/** Narrows tag filter options while the user types in the combobox field. */
export function filterNodesBySearch<T extends {label: string; value: string}>(
	nodes: T[],
	searchTerm: string,
): T[] {
	const query = searchTerm.trim().toLowerCase();
	if (!query) {
		return nodes;
	}
	return nodes.filter((node) => node.label.toLowerCase().includes(query));
}

/** Master-checkbox state for a multi-select filter group. */
export function getSelectAllState(
	selected: string[],
	allValues: string[],
): "checked" | "unchecked" | "indeterminate" {
	if (allValues.length === 0) {
		return "unchecked";
	}

	const selectedSet = new Set(selected);
	const matchCount = allValues.filter((value) =>
		selectedSet.has(value),
	).length;

	if (matchCount === 0) {
		return "unchecked";
	}
	if (matchCount === allValues.length) {
		return "checked";
	}
	return "indeterminate";
}

/** Selects every option value or clears the group when `select` is false. */
export function applySelectAll(allValues: string[], select: boolean): string[] {
	return select ? [...allValues] : [];
}

/** Computes the next selected values for one filter group after a user toggle. */
export function toggleFilterSelection(
	current: string[],
	value: string,
	multiple?: boolean,
): string[] {
	if (multiple !== false) {
		return current.includes(value)
			? current.filter((entry) => entry !== value)
			: [...current, value];
	}

	return current.length === 1 && current[0] === value ? [] : [value];
}

/** Keeps rows that pass every active filter group (AND across groups). */
export function applyFilters(
	table: DatabaseTable,
	filters: FilterDef[],
	selection: FilterSelection,
): string[][] {
	return table.rows.filter((row) =>
		filters.every((filter, index) =>
			rowMatchesFilter(row, filter, selection[index] ?? []),
		),
	);
}
