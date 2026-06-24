import {fetchText} from "./fetchDataSource";
import type {DatabaseTable, FilterableDatabaseEngine} from "./types";

/**
 * Parses JSON Option A: `{ columns?: string[], rows: unknown[][] }`.
 * All cell values are coerced to strings; optional `columns` is ignored at parse time (filters use column indices).
 */
function parseJson(raw: string): DatabaseTable {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new Error("Invalid JSON database file");
	}

	if (
		typeof parsed !== "object" ||
		parsed === null ||
		Array.isArray(parsed)
	) {
		throw new Error('JSON database must be an object with a "rows" array');
	}

	const {rows} = parsed as {rows?: unknown};
	if (rows === undefined) {
		throw new Error('JSON database is missing "rows"');
	}
	if (!Array.isArray(rows)) {
		throw new Error('JSON database "rows" must be an array');
	}

	const normalizedRows = rows.map((row, index) => {
		if (!Array.isArray(row)) {
			throw new Error(
				`JSON database row at index ${index} must be an array`,
			);
		}
		return row.map((cell) => String(cell));
	});

	return {rows: normalizedRows};
}

/** {@link FilterableDatabaseEngine} for JSON database files fetched via public href. */
export const jsonEngine: FilterableDatabaseEngine = {
	async fetch(href: string): Promise<string> {
		return fetchText(href, "JSON");
	},
	parse: parseJson,
};
