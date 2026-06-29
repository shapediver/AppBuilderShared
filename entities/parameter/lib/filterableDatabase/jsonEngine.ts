import {fetchText} from "./fetchDataSource";
import type {DatabaseTable, FilterableDatabaseEngine} from "./types";

/**
 * Standard row fields with a fixed infer order. Any other keys (e.g. `category`, `tags`)
 * are appended alphabetically after these.
 */
const JSON_STANDARD_FIELD_ORDER = [
	"value",
	"title",
	"imageUrl",
	"tooltip",
	"description",
	"color",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Multivalued JSON arrays (e.g. `tags`) join with `;` to match CSV / filterLogic. */
export function jsonCellToString(cell: unknown): string {
	if (cell === undefined) {
		return "";
	}
	if (Array.isArray(cell)) {
		return cell
			.map((item) => String(item).trim())
			.filter((item) => item.length > 0)
			.join(";");
	}
	return String(cell);
}

function inferColumns(records: Record<string, unknown>[]): string[] {
	const allKeys = new Set<string>();
	for (const record of records) {
		for (const key of Object.keys(record)) {
			allKeys.add(key);
		}
	}

	const standardSet = new Set<string>(JSON_STANDARD_FIELD_ORDER);
	const ordered: string[] = [];
	for (const field of JSON_STANDARD_FIELD_ORDER) {
		if (allKeys.has(field)) {
			ordered.push(field);
		}
	}

	const rest: string[] = [];
	for (const key of allKeys) {
		if (!standardSet.has(key)) {
			rest.push(key);
		}
	}
	rest.sort();

	return [...ordered, ...rest];
}

function recordToRow(
	record: Record<string, unknown>,
	columns: string[],
): string[] {
	return columns.map((column) => jsonCellToString(record[column]));
}

/**
 * Parses JSON database files where each row is an object with named fields.
 *
 * @example
 * {
 *   "columns": ["value", "title", "imageUrl", "category", "color", "tags"],
 *   "rows": [
 *     {
 *       "value": "Option 1",
 *       "title": "Red Cotton",
 *       "tags": ["Cotton", "Linen"]
 *     }
 *   ]
 * }
 *
 * `columns` is optional; when omitted, field order is inferred (`value`, `title`, then known fields).
 * Array values (e.g. `tags`) are stored as semicolon-separated strings for multivalued filters.
 * A top-level array of row objects is also accepted.
 */
function parseJsonRecordRows(
	rows: unknown[],
	columnOrder?: string[],
): DatabaseTable {
	if (rows.length === 0) {
		throw new Error('JSON database "rows" must not be empty');
	}

	const records = rows.map((row, index) => {
		if (!isRecord(row)) {
			throw new Error(
				`JSON database row at index ${index} must be an object`,
			);
		}
		if (!("value" in row)) {
			throw new Error(
				`JSON database row at index ${index} is missing "value"`,
			);
		}
		return row;
	});

	const resolvedColumns = columnOrder?.length
		? columnOrder
		: inferColumns(records);

	if (!resolvedColumns.includes("value")) {
		throw new Error('JSON database "columns" must include "value"');
	}

	return {
		rows: records.map((record) => recordToRow(record, resolvedColumns)),
	};
}

function parseJson(raw: string): DatabaseTable {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new Error("Invalid JSON database file");
	}

	if (Array.isArray(parsed)) {
		return parseJsonRecordRows(parsed);
	}

	if (!isRecord(parsed)) {
		throw new Error("JSON database must be an object or an array of rows");
	}

	const {rows, columns: columnNames} = parsed;
	if (rows === undefined) {
		throw new Error('JSON database is missing "rows"');
	}
	if (!Array.isArray(rows)) {
		throw new Error('JSON database "rows" must be an array');
	}

	const columnOrder = Array.isArray(columnNames)
		? columnNames.map((column) => String(column))
		: undefined;

	return parseJsonRecordRows(rows, columnOrder);
}

/** {@link FilterableDatabaseEngine} for JSON database files fetched via public href. */
export const jsonEngine: FilterableDatabaseEngine = {
	async fetch(href: string): Promise<string> {
		return fetchText(href, "JSON");
	},
	parse: parseJson,
};
