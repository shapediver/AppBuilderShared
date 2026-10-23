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
});
