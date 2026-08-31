/**
 * Parse the value of a selection parameter and extract the selected node names.
 * Invalid or empty values yield an empty selection.
 * @param value Serialized selection parameter value, e.g. {"names": ["a", "b"]}.
 * @returns
 */
export const parseSelectionNames = (value?: string): string[] => {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);

		return Array.isArray(parsed?.names) ? parsed.names : [];
	} catch {
		return [];
	}
};
