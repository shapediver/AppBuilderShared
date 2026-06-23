import type {DatabaseTable, FilterSelection} from "./types";

export type FilterDef = {
	column: number;
	multivalued?: boolean;
	multiple?: boolean;
	type?: "color";
	filterValues?: string[];
};

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

export function extractFilterValues(
	table: DatabaseTable,
	filter: FilterDef,
): string[] {
	if (filter.filterValues !== undefined) {
		return [...filter.filterValues].sort((a, b) => a.localeCompare(b));
	}

	const valueSet = new Set<string>();
	for (const row of table.rows) {
		for (const value of getCellValues(row, filter.column, filter.multivalued)) {
			valueSet.add(value);
		}
	}

	return Array.from(valueSet).sort((a, b) => a.localeCompare(b));
}

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
