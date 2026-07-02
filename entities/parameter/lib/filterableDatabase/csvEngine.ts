import {fetchText} from "./fetchDataSource";
import type {DatabaseTable, FilterableDatabaseEngine} from "./types";

/** RFC-style CSV line parser (quoted fields, escaped quotes, comma delimiter). */
function parseCsvLine(line: string): string[] {
	const cells: string[] = [];
	let current = "";
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (inQuotes) {
			if (ch === '"') {
				if (line[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				current += ch;
			}
		} else if (ch === '"') {
			inQuotes = true;
		} else if (ch === ",") {
			cells.push(current);
			current = "";
		} else {
			current += ch;
		}
	}
	cells.push(current);
	return cells;
}

/**
 * Parses CSV text into a {@link DatabaseTable}.
 * v1: the first non-empty row is always treated as a header and dropped.
 */
function parseCsv(raw: string): DatabaseTable {
	const rows = raw
		.split(/\r?\n/)
		.map((l) => l.trimEnd())
		.filter((l) => l.length > 0)
		.map(parseCsvLine);
	if (rows.length > 0) {
		rows.shift();
	}
	return {rows};
}

/** {@link FilterableDatabaseEngine} for comma-separated database files fetched via public href. */
export const csvEngine: FilterableDatabaseEngine = {
	async fetch(href: string): Promise<string> {
		return fetchText(href, "CSV");
	},
	parse: parseCsv,
};
