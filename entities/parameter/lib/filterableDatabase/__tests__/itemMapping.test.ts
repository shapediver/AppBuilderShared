import {mapRowsToSelectItems} from "../itemMapping";

const def = {
	value: 0,
	displayname: 1,
	description: 2,
	data: {weight: 3, material: 4},
};

it("maps rows to items and itemData", () => {
	const rows = [["SKU1", "Fabric A", "Soft", "120", "Cotton"]];
	const {items, itemData} = mapRowsToSelectItems(rows, def);
	expect(items).toEqual(["SKU1"]);
	expect(itemData.SKU1).toEqual({
		displayname: "Fabric A",
		description: "Soft",
		data: {weight: "120", material: "Cotton"},
	});
});

it("maps tooltip, imageUrl, and color when those columns are defined", () => {
	const {itemData} = mapRowsToSelectItems(
		[["SKU1", "  Tip  ", "  https://img  ", "  #ff0000  "]],
		{value: 0, tooltip: 1, imageUrl: 2, color: 3},
	);
	expect(itemData.SKU1).toEqual({
		tooltip: "Tip",
		imageUrl: "https://img",
		color: "#ff0000",
	});
});

it("omits optional fields when those columns are not defined", () => {
	const {itemData} = mapRowsToSelectItems([["SKU1"]], {value: 0});
	expect(itemData.SKU1).toStrictEqual({});
});

it("trims value and mapped fields", () => {
	const {items, itemData} = mapRowsToSelectItems(
		[["  SKU1  ", "  Fabric A  ", "  Soft  ", "  120  "]],
		{value: 0, displayname: 1, description: 2, data: {weight: 3}},
	);
	expect(items).toEqual(["SKU1"]);
	expect(itemData.SKU1).toEqual({
		displayname: "Fabric A",
		description: "Soft",
		data: {weight: "120"},
	});
});

it("treats missing cells as empty instead of throwing", () => {
	const {items, itemData} = mapRowsToSelectItems([["SKU1"]], {
		value: 0,
		displayname: 1,
		tooltip: 2,
		description: 3,
		imageUrl: 4,
		color: 5,
		data: {weight: 6},
	});
	expect(items).toEqual(["SKU1"]);
	expect(itemData.SKU1).toEqual({
		displayname: undefined,
		tooltip: undefined,
		description: undefined,
		imageUrl: undefined,
		color: undefined,
		data: {weight: ""},
	});
});

it("skips a row when the value column is missing instead of throwing", () => {
	expect(() =>
		mapRowsToSelectItems([["only"]], {value: 1}),
	).not.toThrow();
	expect(mapRowsToSelectItems([["only"]], {value: 1}).items).toEqual([]);
});

it("skips rows with empty or whitespace-only value column", () => {
	const rows = [["", "X"], ["   ", "Z"], ["SKU2", "Y"]];
	const {items} = mapRowsToSelectItems(rows, {value: 0});
	expect(items).toEqual(["SKU2"]);
});

it("deduplicates by value keeping last metadata and first list order", () => {
	const rows = [
		["dup", "First"],
		["dup", "Second"],
		["other", "Other"],
	];
	const {items, itemData} = mapRowsToSelectItems(rows, {
		value: 0,
		displayname: 1,
	});
	expect(items).toEqual(["dup", "other"]);
	expect(itemData.dup.displayname).toBe("Second");
});
