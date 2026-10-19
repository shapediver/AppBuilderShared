import type {DatabaseTable, FilterSelection} from "./types";

/** One filter group definition (column index + multivalued / multiple UI semantics). */
export type FilterDef = {
	column: number;
	/** Optional 0-based column index for option text. Matching stays on `column`. */
	columnLabel?: number;
	multivalued?: boolean;
	multiple?: boolean;
	type?: "color" | "text";
	filterValues?: string[];
};

/** One unique filter option: matching key (`value`) plus displayed text (`label`). */
export type FilterOption = {
	value: string;
	label: string;
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
 * Unique filter options shown in a filter group, sorted by value.
 * Uses `filterValues` from settings when provided; otherwise derives from the table column.
 * Option text comes from `columnLabel` when set; matching keys stay on `column`.
 */
export function extractFilterOptions(
	table: DatabaseTable,
	filter: FilterDef,
	filterIndex?: number,
): FilterOption[] {
	// One entry per unique `column` value. Labels attach here so we do not
	// scan the table again in the hook (multivalued pairing is per-row).
	const labelByValue = new Map<string, string>();

	for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
		const row = table.rows[rowIndex];
		// Same split/trim/drop-empty rules as matching, so a token that
		// cannot match cannot get a label either.
		const values = getCellValues(row, filter.column, filter.multivalued);
		// No `columnLabel`: display text is the value (pre-SS-10048 behavior).
		if (filter.columnLabel === undefined) {
			for (const value of values) {
				if (!labelByValue.has(value)) {
					labelByValue.set(value, value);
				}
			}
			continue;
		}

		const labels = getCellValues(
			row,
			filter.columnLabel,
			filter.multivalued,
		);
		// Authors must keep token counts aligned *after* empty segments are
		// dropped. Warn once per bad row; still build options below.
		if (labels.length !== values.length) {
			console.warn(
				`Filterable database filter ${filterIndex ?? "?"}: row ${rowIndex} has ${values.length} value item(s) and ${labels.length} label item(s)`,
			);
		}
		// Zip to `values.length`: missing label → value; extra labels ignored.
		for (let i = 0; i < values.length; i++) {
			const value = values[i];
			const label = labels[i] || value;
			const stored = labelByValue.get(value);
			// Unique by value. First real name wins: fill a fallback later,
			// but never overwrite a real name (conflicting names = bad data).
			if (stored === undefined) {
				labelByValue.set(value, label);
			} else if (stored === value && label !== value) {
				labelByValue.set(value, label);
			}
		}
	}
	// Settings list is the option *values*; labels still come from the scan.
	// A listed value that never appears in the table keeps label === value.
	if (filter.filterValues !== undefined) {
		return [...filter.filterValues]
			.sort((a, b) => a.localeCompare(b))
			.map((value) => ({
				value,
				label: labelByValue.get(value) ?? value,
			}));
	}

	return Array.from(labelByValue.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([value, label]) => ({value, label}));
}

/**
 * Unique values shown in a filter group.
 * Uses `filterValues` from settings when provided; otherwise derives from the table column.
 */
export function extractFilterValues(
	table: DatabaseTable,
	filter: FilterDef,
): string[] {
	return extractFilterOptions(table, filter).map((option) => option.value);
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
