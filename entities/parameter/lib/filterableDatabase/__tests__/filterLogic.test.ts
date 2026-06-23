import type {DatabaseTable} from "../types";
import {
	applyFilters,
	extractFilterValues,
	getCellValues,
	rowMatchesFilter,
} from "../filterLogic";

type FilterDef = {
	column: number;
	multivalued?: boolean;
	multiple?: boolean;
	type?: "color";
	filterValues?: string[];
};

const table: DatabaseTable = {
	rows: [
		["id1", "Red", "Cotton;Linen"],
		["id2", "Blue", "Wool"],
		["id3", "Red", "Silk"],
	],
};

const filters: FilterDef[] = [
	{column: 1, multiple: true},
	{column: 2, multivalued: true, multiple: true},
];

describe("extractFilterValues", () => {
	it("returns unique values from column sorted alphabetically", () => {
		expect(extractFilterValues(table, filters[0])).toEqual(["Blue", "Red"]);
	});

	it("returns filterValues when provided instead of deriving from table", () => {
		const filter: FilterDef = {
			column: 1,
			filterValues: ["Green", "Yellow"],
		};
		expect(extractFilterValues(table, filter)).toEqual(["Green", "Yellow"]);
	});

	it("splits multivalued cells by semicolon for unique values", () => {
		expect(extractFilterValues(table, filters[1])).toEqual([
			"Cotton",
			"Linen",
			"Silk",
			"Wool",
		]);
	});
});

describe("getCellValues", () => {
	it("returns a single trimmed cell value when not multivalued", () => {
		expect(getCellValues(table.rows[0], 1)).toEqual(["Red"]);
	});

	it("splits multivalued cells by semicolon and trims segments", () => {
		expect(getCellValues(table.rows[0], 2, true)).toEqual(["Cotton", "Linen"]);
	});
});

describe("applyFilters", () => {
	it("filters rows by a single filter selection", () => {
		const result = applyFilters(table, filters, {0: ["Red"]});
		expect(result).toEqual([
			["id1", "Red", "Cotton;Linen"],
			["id3", "Red", "Silk"],
		]);
	});

	it("ANDs selections across two filter groups", () => {
		const result = applyFilters(table, filters, {0: ["Red"], 1: ["Silk"]});
		expect(result).toEqual([["id3", "Red", "Silk"]]);
	});

	it("passes all rows when a filter group has an empty selection", () => {
		const result = applyFilters(table, filters, {0: ["Red"], 1: []});
		expect(result).toEqual([
			["id1", "Red", "Cotton;Linen"],
			["id3", "Red", "Silk"],
		]);
	});

	it("matches multivalued rows when any segment matches a selected value", () => {
		const result = applyFilters(table, filters, {1: ["Cotton"]});
		expect(result).toEqual([["id1", "Red", "Cotton;Linen"]]);
	});
});

describe("rowMatchesFilter", () => {
	it("returns true when no values are selected", () => {
		expect(rowMatchesFilter(table.rows[0], filters[0], [])).toBe(true);
	});

	it("returns true when any selected value matches a cell segment", () => {
		expect(rowMatchesFilter(table.rows[0], filters[1], ["Linen"])).toBe(true);
		expect(rowMatchesFilter(table.rows[0], filters[1], ["Wool"])).toBe(false);
	});
});
