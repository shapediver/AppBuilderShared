import {fetchText} from "./fetchDataSource";
import type {DatabaseTable, FilterableDatabaseEngine} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Multivalued JSON arrays (e.g. `materials`) join with `;` to match CSV / filterLogic. */
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

function getRowCell(record: Record<string, unknown>, column: string): unknown {
	if (column !== "data" && column in record) {
		return record[column];
	}
	const nested = record["data"];
	if (isRecord(nested) && column in nested) {
		return nested[column];
	}
	return undefined;
}

function inferColumns(records: Record<string, unknown>[]): string[] {
	const topLevel: string[] = [];
	const dataKeys: string[] = [];

	for (const record of records) {
		for (const key of Object.keys(record)) {
			if (key !== "data" && !topLevel.includes(key)) {
				topLevel.push(key);
			}
		}
		const nestedData = record["data"];
		if (isRecord(nestedData)) {
			for (const key of Object.keys(nestedData)) {
				if (!dataKeys.includes(key)) {
					dataKeys.push(key);
				}
			}
		}
	}

	// "value" is required on object rows — surface it first when present.
	const ordered: string[] = [];
	const valueIndex = topLevel.indexOf("value");
	if (valueIndex !== -1) {
		ordered.push("value");
		topLevel.splice(valueIndex, 1);
	}
	ordered.push(...topLevel);

	const rest = [...dataKeys].sort();
	return [...ordered, ...rest];
}

function recordToRow(
	record: Record<string, unknown>,
	columns: string[],
): string[] {
	return columns.map((column) =>
		jsonCellToString(getRowCell(record, column)),
	);
}

function normalizeArrayRow(row: unknown[], index: number): string[] {
	if (!Array.isArray(row)) {
		throw new Error(`JSON database row at index ${index} must be an array`);
	}
	return row.map((cell) => String(cell));
}

/**
 * Parses JSON database files into {@link DatabaseTable} (`string[][]` rows).
 *
 * Row objects mirror settings `itemDataDefinition`: top-level `value`, `displayname`,
 * `imageUrl`, … (any keys, not a fixed whitelist) and custom fields under `"data"`
 * (same keys as `itemDataDefinition.data`).
 *
 * @example
 * {
 *   "columns": ["value", "displayname", "imageUrl", "category", "color", "materials"],
 *   "rows": [
 *     {
 *       "value": "Option 1",
 *       "displayname": "Red Cotton",
 *       "imageUrl": "https://…",
 *       "data": {
 *         "category": "Fabric",
 *         "color": "Red",
 *         "materials": ["Cotton", "Linen"]
 *       }
 *     }
 *   ]
 * }
 *
 * `columns` lists top-level fields (any keys, first-seen order with `value` first)
 * then custom `data` keys. Array rows (`string[][]`) are also accepted.
 */
function parseJsonRows(rows: unknown[], columnOrder?: string[]): DatabaseTable {
	if (rows.length === 0) {
		throw new Error('JSON database "rows" must not be empty');
	}

	if (Array.isArray(rows[0])) {
		return {
			rows: rows.map((row, index) =>
				normalizeArrayRow(row as unknown[], index),
			),
		};
	}

	const records = rows.map((row, index) => {
		if (!isRecord(row)) {
			throw new Error(
				`JSON database row at index ${index} must be an object or array`,
			);
		}
		if (row.value === undefined) {
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

	if (!isRecord(parsed)) {
		throw new Error("JSON database must be an object with a rows array");
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

	return parseJsonRows(rows, columnOrder);
}

/** {@link FilterableDatabaseEngine} for JSON database files fetched via public href. */
export const jsonEngine: FilterableDatabaseEngine = {
	async fetch(href: string): Promise<string> {
		return fetchText(href, "JSON");
	},
	parse: parseJson,
};
