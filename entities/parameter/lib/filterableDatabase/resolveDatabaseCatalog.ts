import type {
	IFilterableDatabaseSettings,
	ISelectComponentItemDataType,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {filterHiddenSelectItems} from "../select/filterHiddenSelectItems";
import {applyFilters} from "./filterLogic";
import {mapRowsToSelectItems} from "./itemMapping";
import type {DatabaseTable, FilterSelection} from "./types";

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
 * An empty filter list or an empty selection keeps every row.
 * Hidden patched items stay in `itemData` and are removed from `items`.
 */
export function resolveDatabaseCatalog(
	table: DatabaseTable,
	settings: IFilterableDatabaseSettings,
	selection: FilterSelection,
	patch?: Record<string, ISelectComponentItemDataType>,
): {items: string[]; itemData: Record<string, ISelectComponentItemDataType>} {
	const rows = applyFilters(table, settings.filters, selection);
	const mapped = mapRowsToSelectItems(rows, settings.itemDataDefinition);
	const itemData = mergeDatabaseItemData(mapped.itemData, patch);

	return {
		items: filterHiddenSelectItems(mapped.items, itemData),
		itemData,
	};
}
