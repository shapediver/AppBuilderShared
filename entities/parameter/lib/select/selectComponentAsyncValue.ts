import type {ISelectComponentItemDataType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

/**
 * Whether the parameter value still matches a visible card after filters/search reload.
 * Cards use item keys; String+database parameters store `JSON.stringify(itemData.data)` —
 * both shapes must be recognized for card highlighting.
 */
export function isValueInAvailableItems(
	value: string,
	items: string[],
	itemsData?: Record<string, ISelectComponentItemDataType>,
): boolean {
	if (items.includes(value)) {
		return true;
	}

	if (!itemsData) {
		return false;
	}

	return items.some((key) => {
		const data = itemsData[key]?.data;
		return data !== undefined && JSON.stringify(data) === value;
	});
}

/**
 * Maps the stored parameter value back to an item key for card highlighting.
 * Grid/fullwidthcards compare `value === itemKey`; when `emitValue` is `itemData`
 * the model holds serialized `data`, not the key.
 */
export function resolveItemKeyForValue(
	value: string,
	items: string[],
	itemsData?: Record<string, ISelectComponentItemDataType>,
): string {
	if (items.includes(value)) {
		return value;
	}

	if (!itemsData) {
		return value;
	}

	const match = items.find((key) => {
		const data = itemsData[key]?.data;
		return data !== undefined && JSON.stringify(data) === value;
	});

	return match ?? value;
}

/**
 * Item key passed to card `isSelected` when filters/search change.
 * Returns `undefined` when the committed parameter value is not among visible items
 * so the UI does not highlight a different card while the parameter stays unchanged.
 */
export function resolveDisplayValueForCards(
	value: string | null | undefined,
	items: string[],
	itemsData?: Record<string, ISelectComponentItemDataType>,
): string | null | undefined {
	if (!value) {
		return value;
	}

	if (!isValueInAvailableItems(value, items, itemsData)) {
		return undefined;
	}

	return resolveItemKeyForValue(value, items, itemsData);
}
