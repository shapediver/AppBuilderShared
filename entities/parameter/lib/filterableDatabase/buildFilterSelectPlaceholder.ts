/** Placeholder text for the filter combobox when no tags are shown in the input. */
export function buildFilterSelectPlaceholder(
	activeTagCount: number,
	placeholder = "Filters",
): string {
	if (activeTagCount === 0) {
		return placeholder;
	}

	const suffix = activeTagCount === 1 ? "" : "s";
	return `${activeTagCount} filter${suffix} active`;
}
