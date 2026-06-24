import type {
	IFilterableDatabaseSettings,
	ISelectComponentItemDataType,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

/**
 * Maps filtered table rows to {@link SelectComponent} `items` + `itemData`.
 * Rows with an empty value column are skipped; duplicate values keep first list order, last row wins in itemData.
 */
export function mapRowsToSelectItems(
	rows: string[][],
	itemDataDefinition: IFilterableDatabaseSettings["itemDataDefinition"],
): {items: string[]; itemData: Record<string, ISelectComponentItemDataType>} {
	const itemData: Record<string, ISelectComponentItemDataType> = {};
	const items: string[] = [];
	const seen = new Set<string>();

	for (const row of rows) {
		const value = row[itemDataDefinition.value]?.trim() ?? "";
		if (!value) continue;

		const entry: ISelectComponentItemDataType = {};
		if (itemDataDefinition.displayname !== undefined) {
			entry.displayname = row[itemDataDefinition.displayname]?.trim();
		}
		if (itemDataDefinition.tooltip !== undefined) {
			entry.tooltip = row[itemDataDefinition.tooltip]?.trim();
		}
		if (itemDataDefinition.description !== undefined) {
			entry.description = row[itemDataDefinition.description]?.trim();
		}
		if (itemDataDefinition.imageUrl !== undefined) {
			entry.imageUrl = row[itemDataDefinition.imageUrl]?.trim();
		}
		if (itemDataDefinition.color !== undefined) {
			entry.color = row[
				itemDataDefinition.color
			]?.trim() as ISelectComponentItemDataType["color"];
		}
		if (itemDataDefinition.data) {
			entry.data = {};
			for (const [key, col] of Object.entries(itemDataDefinition.data)) {
				entry.data[key] = row[col]?.trim() ?? "";
			}
		}

		itemData[value] = entry;
		// First occurrence defines dropdown order; later rows overwrite metadata for the same value.
		if (!seen.has(value)) {
			seen.add(value);
			items.push(value);
		}
	}

	return {items, itemData};
}
