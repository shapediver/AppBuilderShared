import type {DatabaseTable, FilterableDatabaseEngine} from "./types";

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

function parseCsv(raw: string): DatabaseTable {
	const rows = raw
		.split(/\r?\n/)
		.map((l) => l.trimEnd())
		.filter((l) => l.length > 0)
		.map(parseCsvLine);
	return {rows};
}

export const csvEngine: FilterableDatabaseEngine = {
	async fetch(href: string): Promise<string> {
		const res = await fetch(href);
		if (!res.ok) {
			throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
		}
		return res.text();
	},
	parse: parseCsv,
};
