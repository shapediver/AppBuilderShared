import {
	applyFilters,
	applySelectAll,
	filterNodesBySearch,
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
});

describe("filterNodesBySearch", () => {
	const nodes = [
		{value: "Red", label: "Red"},
		{value: "Blue", label: "Blue"},
	];

	it("returns all nodes when search is empty", () => {
		expect(filterNodesBySearch(nodes, "")).toEqual(nodes);
	});

	it("filters nodes by label", () => {
		expect(filterNodesBySearch(nodes, "bl")).toEqual([
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
