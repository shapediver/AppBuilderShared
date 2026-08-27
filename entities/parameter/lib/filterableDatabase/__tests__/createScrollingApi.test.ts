import {createFilterableDatabaseScrollingApi} from "../createScrollingApi";
import type {DatabaseTable} from "../types";

type FilterableDatabaseSettings = Parameters<
	typeof createFilterableDatabaseScrollingApi
>[0]["settings"];

const table: DatabaseTable = {
	rows: [
		["id1", "Red Fabric", "Red"],
		["id2", "Blue Fabric", "Blue"],
		["id3", "Green Fabric", "Green"],
		["id4", "Red Cotton", "Red"],
		["id5", "Yellow Fabric", "Yellow"],
	],
};

const settings: FilterableDatabaseSettings = {
	dataSource: {href: "https://example.com/data.csv"},
	itemDataDefinition: {value: 0, displayname: 1},
	filters: [{column: 2, multiple: true}],
};

describe("createFilterableDatabaseScrollingApi", () => {
	it("returns at most pageSize items initially", () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {},
			pageSize: 2,
		});

		expect(api.items).toHaveLength(2);
		expect(api.items.map((entry) => entry.item)).toEqual(["id1", "id2"]);
		expect(api.hasNextPage).toBe(true);
	});

	it("returns pageSize items when the table has more rows", () => {
		const largeTable: DatabaseTable = {
			rows: Array.from({length: 12}, (_, index) => [
				`id${index + 1}`,
				`Item ${index + 1}`,
				"Red",
			]),
		};

		const api = createFilterableDatabaseScrollingApi({
			table: largeTable,
			settings,
			selection: {},
			pageSize: 5,
		});

		expect(api.items).toHaveLength(5);
		expect(api.hasNextPage).toBe(true);
	});

	it("loadMore appends the next page of items", async () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {},
			pageSize: 2,
		});

		await api.loadMore();

		expect(api.items).toHaveLength(4);
		expect(api.items.map((entry) => entry.item)).toEqual([
			"id1",
			"id2",
			"id3",
			"id4",
		]);
	});

	it("hasNextPage is false when all items are loaded", async () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {},
			pageSize: 2,
		});

		await api.loadMore();
		await api.loadMore();

		expect(api.items).toHaveLength(5);
		expect(api.hasNextPage).toBe(false);
	});

	it("updateSelection recomputes filtered items", () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {},
			pageSize: 10,
		});

		api.updateSelection({0: ["Red"]});

		expect(api.items.map((entry) => entry.item)).toEqual(["id1", "id4"]);
		expect(api.hasNextPage).toBe(false);
	});

	it("updateSelection with unchanged selection does not bump resetState", () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {0: ["Red"]},
			pageSize: 10,
		});
		const resetStateBefore = api.resetState;

		api.updateSelection({0: ["Red"]});

		expect(api.resetState).toBe(resetStateBefore);
	});

	it("updateSelection treats undefined filter values as empty", () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {0: undefined as unknown as string[]},
			pageSize: 10,
		});
		const resetStateBefore = api.resetState;

		api.updateSelection({0: []});
		expect(api.resetState).toBe(resetStateBefore);

		api.updateSelection({0: undefined as unknown as string[]});
		expect(api.resetState).toBe(resetStateBefore);
	});

	it("reset clears back to the first page", async () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {},
			pageSize: 2,
		});

		await api.loadMore();
		await api.loadMore();
		expect(api.items).toHaveLength(5);
		const resetStateBefore = api.resetState;

		api.reset();

		expect(api.items).toHaveLength(2);
		expect(api.items.map((entry) => entry.item)).toEqual(["id1", "id2"]);
		expect(api.hasNextPage).toBe(true);
		expect(api.resetState).toBe(resetStateBefore + 1);
	});

	it("setSearchTerms filters items by value and displayname", async () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {},
			pageSize: 10,
		});

		await api.setSearchTerms(["blue"]);

		expect(api.items.map((entry) => entry.item)).toEqual(["id2"]);
		expect(api.hasNextPage).toBe(false);
	});

	it("loadMore bumps resetState so consumers can re-render", async () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {},
			pageSize: 2,
		});
		const resetStateBefore = api.resetState;

		await api.loadMore();

		expect(api.resetState).toBe(resetStateBefore + 1);
	});

	it("setSearchTerms bumps resetState so consumers can re-render", async () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {},
			pageSize: 10,
		});
		const resetStateBefore = api.resetState;

		await api.setSearchTerms(["red"]);

		expect(api.resetState).toBe(resetStateBefore + 1);
	});
});

describe("createFilterableDatabaseScrollingApi selection and paging", () => {
	it("updateSelection treats different values as a change", () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {0: ["Red"]},
			pageSize: 10,
		});
		const resetStateBefore = api.resetState;

		api.updateSelection({0: ["Blue"]});

		expect(api.items.map((entry) => entry.item)).toEqual(["id2"]);
		expect(api.resetState).toBe(resetStateBefore + 1);
	});

	it("updateSelection treats different value counts as a change", () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {0: ["Red"]},
			pageSize: 10,
		});

		api.updateSelection({0: ["Red", "Blue"]});

		expect(api.items.map((entry) => entry.item)).toEqual([
			"id1",
			"id2",
			"id4",
		]);
	});

	it("setSearchTerms requires every term to match", async () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {},
			pageSize: 10,
		});

		await api.setSearchTerms(["fabric", "blue"]);

		expect(api.items.map((entry) => entry.item)).toEqual(["id2"]);

		await api.setSearchTerms(["fabric", "zzz"]);

		expect(api.items).toEqual([]);
	});

	it("loadMore is a no-op when there is no next page", async () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {},
			pageSize: 10,
		});
		const resetStateBefore = api.resetState;
		const itemsBefore = api.items;

		await api.loadMore();

		expect(api.items).toBe(itemsBefore);
		expect(api.hasNextPage).toBe(false);
		expect(api.resetState).toBe(resetStateBefore);
	});

	it("reset keeps hasNextPage false when the full list fits on one page", () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {},
			pageSize: 10,
		});

		api.reset();

		expect(api.items).toHaveLength(5);
		expect(api.hasNextPage).toBe(false);
	});

	it("setPageSize rebuilds the visible page", async () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {},
			pageSize: 2,
		});

		await api.setPageSize(4);

		expect(api.items).toHaveLength(4);
		expect(api.hasNextPage).toBe(true);
	});

	it("updateTable rebuilds items from the new rows", () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {},
			pageSize: 10,
		});
		const resetStateBefore = api.resetState;

		api.updateTable({
			rows: [["id9", "Purple Silk", "Purple"]],
		});

		expect(api.items.map((entry) => entry.item)).toEqual(["id9"]);
		expect(api.resetState).toBe(resetStateBefore + 1);
	});
});
