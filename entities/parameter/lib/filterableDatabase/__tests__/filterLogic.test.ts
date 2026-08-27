import {
	applyFilters,
	applySelectAll,
	extractFilterValues,
	filterNodesBySearch,
	getCellValues,
	getSelectAllState,
	rowMatchesFilter,
	toggleFilterSelection,
} from "../filterLogic";
import type {DatabaseTable, FilterSelection} from "../types";

const table: DatabaseTable = {
	rows: [
		["id1", "Fabric A", "", "Fabric", "Red", "Cotton"],
		["id2", "Fabric B", "", "Leather", "Blue", "Polyester"],
	],
};

describe("toggleFilterSelection", () => {
	describe("multiple !== false (default multi-select)", () => {
		it("adds a value when not selected", () => {
			expect(toggleFilterSelection([], "Red", undefined)).toEqual([
				"Red",
			]);
		});

		it("removes a value when already selected", () => {
			expect(toggleFilterSelection(["Red", "Blue"], "Red", true)).toEqual(
				["Blue"],
			);
		});

		it("treats omitted multiple as multi-select", () => {
			expect(toggleFilterSelection(["Red"], "Blue")).toEqual([
				"Red",
				"Blue",
			]);
		});
	});

	describe("multiple: false (single-select)", () => {
		it("selects one value", () => {
			expect(toggleFilterSelection([], "Red", false)).toEqual(["Red"]);
		});

		it("replaces the previous value", () => {
			expect(toggleFilterSelection(["Red"], "Blue", false)).toEqual([
				"Blue",
			]);
		});

		it("clears when the same value is toggled again", () => {
			expect(toggleFilterSelection(["Red"], "Red", false)).toEqual([]);
		});

		it("replaces even when the current selection has more than one value", () => {
			expect(
				toggleFilterSelection(["Red", "Blue"], "Red", false),
			).toEqual(["Red"]);
		});
	});
});

describe("getCellValues", () => {
	it("returns the cell as a single value when not multivalued", () => {
		expect(getCellValues(["a", "Cotton;Linen"], 1)).toEqual([
			"Cotton;Linen",
		]);
	});

	it("splits, trims, and drops empty tokens when multivalued", () => {
		expect(getCellValues(["a", "Cotton;  ; Linen "], 1, true)).toEqual([
			"Cotton",
			"Linen",
		]);
	});
});

describe("extractFilterValues", () => {
	it("uses sorted filterValues from settings when provided", () => {
		expect(
			extractFilterValues(table, {
				column: 3,
				filterValues: ["Zed", "Amy"],
			}),
		).toEqual(["Amy", "Zed"]);
	});

	it("derives unique sorted values from the table column", () => {
		const unordered: DatabaseTable = {
			rows: [
				["id1", "Zebra"],
				["id2", "Apple"],
			],
		};
		expect(extractFilterValues(unordered, {column: 1})).toEqual([
			"Apple",
			"Zebra",
		]);
	});

	it("derives unique tokens from a multivalued column", () => {
		const multi: DatabaseTable = {
			rows: [
				["id1", "Cotton;Linen"],
				["id2", "Cotton"],
			],
		};
		expect(
			extractFilterValues(multi, {column: 1, multivalued: true}),
		).toEqual(["Cotton", "Linen"]);
	});
});

describe("rowMatchesFilter", () => {
	it("passes when nothing is selected in the group", () => {
		expect(rowMatchesFilter(table.rows[0], {column: 4}, [])).toBe(true);
	});

	it("matches OR within a tag group", () => {
		expect(rowMatchesFilter(table.rows[0], {column: 4}, ["Red"])).toBe(
			true,
		);
		expect(rowMatchesFilter(table.rows[1], {column: 4}, ["Red"])).toBe(
			false,
		);
	});

	it("does not treat tag filters as substring search", () => {
		expect(rowMatchesFilter(["id", "Redhead"], {column: 1}, ["Red"])).toBe(
			false,
		);
		expect(
			rowMatchesFilter(["id", "Redhead"], {type: "text", column: 1}, [
				"Red",
			]),
		).toBe(true);
	});

	it("matches a tag row when any selected value is present", () => {
		expect(
			rowMatchesFilter(table.rows[0], {column: 4}, ["Blue", "Red"]),
		).toBe(true);
	});

	it("matches text filters by substring (case-insensitive)", () => {
		expect(
			rowMatchesFilter(table.rows[0], {type: "text", column: 1}, [
				"fabric a",
			]),
		).toBe(true);
		expect(
			rowMatchesFilter(table.rows[1], {type: "text", column: 1}, [
				"fabric a",
			]),
		).toBe(false);
	});

	it("treats a missing text query token as no filter", () => {
		expect(
			rowMatchesFilter(table.rows[1], {type: "text", column: 1}, [
				undefined as unknown as string,
			]),
		).toBe(true);
	});

	it("trims text queries and treats whitespace-only as no filter", () => {
		expect(
			rowMatchesFilter(table.rows[0], {type: "text", column: 1}, [
				"  FABRIC A  ",
			]),
		).toBe(true);
		expect(
			rowMatchesFilter(table.rows[1], {type: "text", column: 1}, ["   "]),
		).toBe(true);
	});

	it("matches text against any multivalued token", () => {
		expect(
			rowMatchesFilter(
				["id", "Cotton;Linen"],
				{type: "text", column: 1, multivalued: true},
				["lin"],
			),
		).toBe(true);
	});
});

describe("filterNodesBySearch", () => {
	const nodes = [
		{value: "Red", label: "Red"},
		{value: "Blue", label: "Blue"},
	];

	it("returns all nodes when search is empty or whitespace", () => {
		expect(filterNodesBySearch(nodes, "")).toEqual(nodes);
		expect(filterNodesBySearch(nodes, "   ")).toEqual(nodes);
	});

	it("filters nodes by label after trimming", () => {
		expect(filterNodesBySearch(nodes, "  BL  ")).toEqual([
			{value: "Blue", label: "Blue"},
		]);
	});
});

describe("applyFilters", () => {
	const filters = [
		{column: 3, multiple: true},
		{column: 4, multiple: false},
	];

	it("ANDs selections across groups", () => {
		const selection: FilterSelection = {
			0: ["Fabric"],
			1: ["Red"],
		};

		expect(applyFilters(table, filters, selection)).toEqual([
			table.rows[0],
		]);
	});

	it("does not keep a row that matches only one of two groups", () => {
		const selection: FilterSelection = {
			0: ["Fabric"],
			1: ["Blue"],
		};

		expect(applyFilters(table, filters, selection)).toEqual([]);
	});
});

describe("getSelectAllState", () => {
	const allValues = ["Fabric", "Blend", "Synthetic"];

	it("returns unchecked when nothing is selected", () => {
		expect(getSelectAllState([], allValues)).toBe("unchecked");
	});

	it("returns checked when every value is selected", () => {
		expect(getSelectAllState(allValues, allValues)).toBe("checked");
	});

	it("returns indeterminate when some values are selected", () => {
		expect(getSelectAllState(["Fabric", "Blend"], allValues)).toBe(
			"indeterminate",
		);
	});

	it("returns unchecked when allValues is empty", () => {
		expect(getSelectAllState(["Fabric"], [])).toBe("unchecked");
	});
});

describe("applySelectAll", () => {
	const allValues = ["Fabric", "Blend", "Synthetic"];

	it("selects all values when select is true", () => {
		expect(applySelectAll(allValues, true)).toEqual(allValues);
	});

	it("clears selection when select is false", () => {
		expect(applySelectAll(allValues, false)).toEqual([]);
	});
});
