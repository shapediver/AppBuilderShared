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

	it("reset clears back to the first page", async () => {
		const api = createFilterableDatabaseScrollingApi({
			table,
			settings,
			selection: {},
			pageSize: 2,
		});
		const resetStateBefore = api.resetState;

		await api.loadMore();
		await api.loadMore();
		expect(api.items).toHaveLength(5);

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
