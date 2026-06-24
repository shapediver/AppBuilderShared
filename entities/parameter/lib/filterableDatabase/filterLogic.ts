import type {DatabaseTable, FilterSelection} from "./types";

/** One filter group definition (column index + multivalued / multiple UI semantics). */
export type FilterDef = {
	column: number;
	multivalued?: boolean;
	multiple?: boolean;
	type?: "color";
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
 * Empty selection passes; otherwise OR within the group (any selected value matches any cell token).
 */
export function rowMatchesFilter(
	row: string[],
	filter: FilterDef,
	selected: string[],
): boolean {
	if (selected.length === 0) {
		return true;
	}

	const cellValues = getCellValues(row, filter.column, filter.multivalued);
	return selected.some((value) => cellValues.includes(value));
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
