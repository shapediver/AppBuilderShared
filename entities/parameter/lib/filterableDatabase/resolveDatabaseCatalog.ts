import type {
	IFilterableDatabaseSettings,
	ISelectComponentItemDataType,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {filterHiddenSelectItems} from "../select/filterHiddenSelectItems";
import {SEARCH_PREFIX} from "../select/selectComponentAsyncValue";
import {applyFilters} from "./filterLogic";
import {mapRowsToSelectItems} from "./itemMapping";
import type {DatabaseTable, FilterSelection} from "./types";

/**
 * Limits a table to rows whose value is listed in `items`, in that order.
 * A repeated item counts once. Items with no row are ignored.
 * `undefined` keeps every row. An empty list keeps none.
 * Matching uses the trimmed value column, same as {@link mapRowsToSelectItems}.
 * Search suggestion rows (value starts with {@link SEARCH_PREFIX}) are never
 * parameter values, so they are kept after the listed rows, in table order.
 */
export function narrowDatabaseTableByItems(
	table: DatabaseTable,
	valueColumn: number,
	items: readonly string[] | undefined,
): DatabaseTable {
	if (items === undefined) {
		return table;
	}

	const order = new Map<string, number>();
	for (const item of items) {
		const key = item.trim();
		if (!key || order.has(key)) {
			continue;
		}
		order.set(key, order.size);
	}

	if (order.size === 0) {
		return {rows: []};
	}

	const buckets: string[][][] = Array.from({length: order.size}, () => []);
	const searchRows: string[][] = [];
	for (const row of table.rows) {
		const value = row[valueColumn]?.trim() ?? "";
		const index = order.get(value);
		if (index !== undefined) {
			buckets[index].push(row);
		} else if (value.startsWith(SEARCH_PREFIX)) {
			searchRows.push(row);
		}
	}

	return {rows: [...buckets.flat(), ...searchRows]};
}

/**
 * Field-wise patch of database rows.
 * Keys that are not in the database are ignored.
 * A patch field replaces that field only, so `{hidden: true}` keeps the row's label and image.
 */
export function mergeDatabaseItemData(
	databaseItemData: Record<string, ISelectComponentItemDataType>,
	patch: Record<string, ISelectComponentItemDataType> | undefined,
): Record<string, ISelectComponentItemDataType> {
	if (!patch) {
		return databaseItemData;
	}

	const merged: Record<string, ISelectComponentItemDataType> = {
		...databaseItemData,
	};

	for (const [key, override] of Object.entries(patch)) {
		const base = merged[key];
		if (!base || !override) {
			continue;
		}
		merged[key] = {...base, ...override};
	}

	return merged;
}

/**
 * Filtered database rows as select `items` and `itemData`.
 * `items` narrows the table before filters. Omit it to keep every row.
 * An empty filter list or an empty selection keeps every remaining row.
 * Hidden patched items stay in `itemData` and are removed from `items`.
 * Patch keys that are not in the narrowed table are ignored.
 */
export function resolveDatabaseCatalog(
	table: DatabaseTable,
	settings: IFilterableDatabaseSettings,
	selection: FilterSelection,
	patch?: Record<string, ISelectComponentItemDataType>,
	items?: readonly string[],
): {items: string[]; itemData: Record<string, ISelectComponentItemDataType>} {
	const narrowed = narrowDatabaseTableByItems(
		table,
		settings.itemDataDefinition.value,
		items,
	);
	const rows = applyFilters(narrowed, settings.filters, selection);
	const mapped = mapRowsToSelectItems(rows, settings.itemDataDefinition);
	const itemData = mergeDatabaseItemData(mapped.itemData, patch);

	return {
		items: filterHiddenSelectItems(mapped.items, itemData),
		itemData,
	};
}
