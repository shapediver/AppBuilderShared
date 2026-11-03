import {resolveDatabaseCatalog} from "../resolveDatabaseCatalog";
import type {DatabaseTable} from "../types";

const table: DatabaseTable = {
	rows: [
		["granite", "Granite", "#888888"],
		["marble", "Marble", "#f5f5f5"],
		["slate", "Slate", "#334455"],
	],
};

const settings = {
	dataSource: {href: "https://example.com/stones.json"},
	itemDataDefinition: {value: 0, displayname: 1, color: 2},
	filters: [] as {column: number}[],
};

describe("resolveDatabaseCatalog", () => {
	it("returns every row when filters is empty", () => {
		const catalog = resolveDatabaseCatalog(table, settings, {});

		expect(catalog.items).toEqual(["granite", "marble", "slate"]);
		expect(catalog.itemData.granite).toEqual({
			displayname: "Granite",
			color: "#888888",
		});
	});

	it("patches matching rows and drops hidden items", () => {
		const catalog = resolveDatabaseCatalog(
			table,
			settings,
			{},
			{
				marble: {hidden: true},
				granite: {tooltip: "Grey speckled stone"},
				unknown: {hidden: true},
			},
		);

		expect(catalog.items).toEqual(["granite", "slate"]);
		expect(catalog.itemData.granite).toEqual({
			displayname: "Granite",
			color: "#888888",
			tooltip: "Grey speckled stone",
		});
		expect(catalog.itemData.marble.hidden).toBe(true);
		expect(catalog.itemData.unknown).toBeUndefined();
	});

	it("narrows rows with the active filter selection", () => {
		const catalog = resolveDatabaseCatalog(
			table,
			{
				...settings,
				filters: [{column: 2}],
			},
			{0: ["#888888"]},
		);

		expect(catalog.items).toEqual(["granite"]);
	});

	it("shows items in list order and ignores unknown or repeated entries", () => {
		const catalog = resolveDatabaseCatalog(table, settings, {}, undefined, [
			"slate",
			"  granite  ",
			"missing",
			"granite",
		]);

		expect(catalog.items).toEqual(["slate", "granite"]);
		expect(catalog.itemData.missing).toBeUndefined();
	});

	it("keeps search suggestion rows that are not in items", () => {
		const catalog = resolveDatabaseCatalog(
			{
				rows: [
					["search:Granite", "More granite", "#888888"],
					...table.rows,
				],
			},
			settings,
			{},
			undefined,
			["slate", "granite"],
		);

		expect(catalog.items).toEqual(["slate", "granite", "search:Granite"]);
		expect(catalog.itemData["search:Granite"].displayname).toBe(
			"More granite",
		);
	});

	it("shows no rows when items is empty", () => {
		const catalog = resolveDatabaseCatalog(
			table,
			settings,
			{},
			undefined,
			[],
		);

		expect(catalog.items).toEqual([]);
		expect(catalog.itemData).toEqual({});
	});

	it("patches allowed rows and ignores itemData keys outside items", () => {
		const catalog = resolveDatabaseCatalog(
			table,
			settings,
			{},
			{
				marble: {hidden: true},
				granite: {displayname: "Grey rock"},
				slate: {displayname: "Not allowed"},
			},
			["marble", "granite"],
		);

		expect(catalog.items).toEqual(["granite"]);
		expect(catalog.itemData.granite.displayname).toBe("Grey rock");
		expect(catalog.itemData.marble.hidden).toBe(true);
		expect(catalog.itemData.slate).toBeUndefined();
	});

	it("applies items before filters", () => {
		const catalog = resolveDatabaseCatalog(
			table,
			{
				...settings,
				filters: [{column: 2}],
			},
			{0: ["#888888"]},
			undefined,
			["slate", "granite"],
		);

		expect(catalog.items).toEqual(["granite"]);
	});
});
