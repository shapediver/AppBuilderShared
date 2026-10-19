import {
	applyFilters,
	applySelectAll,
	extractFilterOptions,
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

describe("extractFilterOptions", () => {
	let warnSpy: jest.SpyInstance;

	beforeEach(() => {
		warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		warnSpy.mockRestore();
	});

	it("uses the value as the label when columnLabel is omitted", () => {
		const options = extractFilterOptions(table, {column: 4});

		expect(options).toEqual([
			{value: "Blue", label: "Blue"},
			{value: "Red", label: "Red"},
		]);
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it("pairs multivalued value and label segments by index", () => {
		const colorTable: DatabaseTable = {
			rows: [["#111111;#222222", "Black;White"]],
		};

		expect(
			extractFilterOptions(colorTable, {
				column: 0,
				columnLabel: 1,
				multivalued: true,
			}),
		).toEqual([
			{value: "#111111", label: "Black"},
			{value: "#222222", label: "White"},
		]);
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it("falls back missing labels to the value and warns once per row", () => {
		const colorTable: DatabaseTable = {
			rows: [["#111111;#222222", "Black"]],
		};

		expect(
			extractFilterOptions(
				colorTable,
				{column: 0, columnLabel: 1, multivalued: true},
				0,
			),
		).toEqual([
			{value: "#111111", label: "Black"},
			{value: "#222222", label: "#222222"},
		]);
		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy.mock.calls[0][0]).toEqual(
			expect.stringContaining("filter 0"),
		);
		expect(warnSpy.mock.calls[0][0]).toEqual(
			expect.stringContaining("2 value item(s)"),
		);
		expect(warnSpy.mock.calls[0][0]).toEqual(
			expect.stringContaining("1 label item(s)"),
		);
	});

	it("ignores extra labels and warns once per row", () => {
		const colorTable: DatabaseTable = {
			rows: [["#111111", "Black;White"]],
		};

		expect(
			extractFilterOptions(
				colorTable,
				{column: 0, columnLabel: 1, multivalued: true},
				1,
			),
		).toEqual([{value: "#111111", label: "Black"}]);
		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy.mock.calls[0][0]).toEqual(
			expect.stringContaining("filter 1"),
		);
		expect(warnSpy.mock.calls[0][0]).toEqual(
			expect.stringContaining("1 value item(s)"),
		);
		expect(warnSpy.mock.calls[0][0]).toEqual(
			expect.stringContaining("2 label item(s)"),
		);
	});

	it("keeps one option per value and uses the first non-empty label", () => {
		const colorTable: DatabaseTable = {
			rows: [
				["#277DA1", ""],
				["#277DA1", "Blue"],
				["#277DA1", "Navy"],
			],
		};

		expect(
			extractFilterOptions(colorTable, {
				column: 0,
				columnLabel: 1,
			}),
		).toEqual([{value: "#277DA1", label: "Blue"}]);
	});

	it("keeps distinct values that share a display label as two options", () => {
		const colorTable: DatabaseTable = {
			rows: [
				["#277DA1", "Blue"],
				["#F9844A", "Blue"],
			],
		};

		expect(
			extractFilterOptions(colorTable, {
				column: 0,
				columnLabel: 1,
			}),
		).toEqual([
			{value: "#277DA1", label: "Blue"},
			{value: "#F9844A", label: "Blue"},
		]);
	});

	it("uses filterValues as option values and attaches labels from the table", () => {
		const colorTable: DatabaseTable = {
			rows: [["#111111", "Black"]],
		};

		expect(
			extractFilterOptions(colorTable, {
				column: 0,
				columnLabel: 1,
				filterValues: ["#222222", "#111111"],
			}),
		).toEqual([
			{value: "#111111", label: "Black"},
			{value: "#222222", label: "#222222"},
		]);
	});
});

describe("rowMatchesFilter with columnLabel", () => {
	it("matches on column values, not display labels", () => {
		const row = ["#277DA1", "Blue"];

		expect(
			rowMatchesFilter(row, {column: 0, columnLabel: 1, type: "color"}, [
				"#277DA1",
			]),
		).toBe(true);
		expect(
			rowMatchesFilter(row, {column: 0, columnLabel: 1, type: "color"}, [
				"Blue",
			]),
		).toBe(false);
	});
});
