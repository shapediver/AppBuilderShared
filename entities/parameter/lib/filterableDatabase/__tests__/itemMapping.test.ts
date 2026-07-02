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

it("skips rows with empty value column", () => {
	const rows = [["", "X"], ["SKU2", "Y"]];
	const {items} = mapRowsToSelectItems(rows, {value: 0});
	expect(items).toEqual(["SKU2"]);
});

it("deduplicates by value keeping last", () => {
	const rows = [
		["dup", "First"],
		["dup", "Second"],
	];
	const {itemData} = mapRowsToSelectItems(rows, {value: 0, displayname: 1});
	expect(itemData.dup.displayname).toBe("Second");
});
