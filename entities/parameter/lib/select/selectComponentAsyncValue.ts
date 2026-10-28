import type {ISelectComponentItemDataType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

/**
 * Value committed when an item is chosen.
 * `itemData` stores `JSON.stringify(itemData.data)` when that object exists.
 * Otherwise the item key is stored.
 */
export function emitSelectValue(
	itemKey: string | null,
	emitValue: "itemKey" | "itemData" | undefined,
	itemData?: Record<string, ISelectComponentItemDataType>,
): string | null {
	if (emitValue === "itemData" && itemKey && itemData?.[itemKey]?.data) {
		return JSON.stringify(itemData[itemKey].data);
	}
	return itemKey;
}

/** Deep equality of JSON values, independent of the order of object keys. */
function jsonEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (
		typeof a !== "object" ||
		typeof b !== "object" ||
		a === null ||
		b === null ||
		Array.isArray(a) !== Array.isArray(b)
	)
		return false;
	if (Array.isArray(a) && Array.isArray(b))
		return (
			a.length === b.length && a.every((item, i) => jsonEqual(item, b[i]))
		);
	const aKeys = Object.keys(a);
	const bRecord = b as Record<string, unknown>;
	return (
		aKeys.length === Object.keys(b).length &&
		aKeys.every(
			(key) =>
				key in bRecord &&
				jsonEqual((a as Record<string, unknown>)[key], bRecord[key]),
		)
	);
}

/**
 * Whether a stored parameter value is the serialized `data` of an item. The
 * comparison ignores the order of the keys: the settings travel through the
 * model, which may return the `data` mapping with its keys in another order
 * after a computation than when the value was stored.
 */
function isItemDataValue(data: unknown, value: string): boolean {
	if (data === undefined) return false;
	if (JSON.stringify(data) === value) return true;
	try {
		return jsonEqual(data, JSON.parse(value));
	} catch {
		return false;
	}
}

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
		return isItemDataValue(itemsData[key]?.data, value);
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
		return isItemDataValue(itemsData[key]?.data, value);
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
