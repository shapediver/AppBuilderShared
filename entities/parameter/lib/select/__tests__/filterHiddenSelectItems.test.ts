import {filterHiddenSelectItems} from "../filterHiddenSelectItems";

describe("filterHiddenSelectItems", () => {
	it("drops items whose itemData.hidden is true and keeps other itemData", () => {
		expect(
			filterHiddenSelectItems(["Oak", "Walnut", "Maple"], {
				Walnut: {hidden: true, displayname: "Walnut"},
				Maple: {displayname: "Hard maple", tooltip: "Dense"},
			}),
		).toEqual(["Oak", "Maple"]);
	});

	it("keeps every item when itemData is missing", () => {
		expect(filterHiddenSelectItems(["Oak", "Maple"], undefined)).toEqual([
			"Oak",
			"Maple",
		]);
	});

	it("returns an empty list when items are missing", () => {
		expect(
			filterHiddenSelectItems(undefined, {Oak: {hidden: true}}),
		).toEqual([]);
	});
});
