/** Parse StringList index from store value (string) or agent input (number). */
export function parseStringListIndex(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isInteger(value)) {
		return value;
	}
	if (
		typeof value === "string" &&
		value !== "" &&
		!Number.isNaN(Number(value))
	) {
		const index = Number(value);
		if (Number.isInteger(index)) {
			return index;
		}
	}

	return undefined;
}

/** ShapeDiver StringList validator expects string index, not number. */
export function toStringListStoreValue(value: unknown): string | undefined {
	const index = parseStringListIndex(value);
	if (index === undefined) {
		return undefined;
	}

	return String(index);
}
