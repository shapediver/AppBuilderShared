import {
	emitSelectValue,
	isValueInAvailableItems,
	resolveDisplayValueForCards,
} from "../selectComponentAsyncValue";

const itemsData = {
	a: {
		displayname: "Alpha",
		data: {category: "Fabric", color: "Red"},
	},
	b: {
		displayname: "Beta",
		data: {category: "Fabric", color: "Blue"},
	},
};

describe("selectComponentAsyncValue", () => {
	it("emitSelectValue stores JSON data when emitValue is itemData", () => {
		expect(emitSelectValue("b", "itemData", itemsData)).toBe(
			JSON.stringify(itemsData.b.data),
		);
	});

	it("emitSelectValue stores the item key when the row has no data", () => {
		expect(
			emitSelectValue("a", "itemData", {a: {displayname: "Alpha"}}),
		).toBe("a");
	});

	it("emitSelectValue stores the item key when emitValue is itemKey", () => {
		expect(emitSelectValue("b", "itemKey", itemsData)).toBe("b");
	});

	it("resolveDisplayValueForCards highlights when item key is visible", () => {
		expect(resolveDisplayValueForCards("a", ["a", "b"], itemsData)).toBe(
			"a",
		);
	});

	it("resolveDisplayValueForCards returns undefined when selected item is filtered out", () => {
		expect(
			resolveDisplayValueForCards("a", ["b"], itemsData),
		).toBeUndefined();
	});

	it("resolveDisplayValueForCards highlights JSON value when matching row is visible", () => {
		const json = JSON.stringify(itemsData.b.data);
		expect(resolveDisplayValueForCards(json, ["b"], itemsData)).toBe("b");
	});

	it("resolveDisplayValueForCards returns undefined when JSON value row is filtered out", () => {
		const json = JSON.stringify(itemsData.a.data);
		expect(
			resolveDisplayValueForCards(json, ["b"], itemsData),
		).toBeUndefined();
	});

	it("isValueInAvailableItems does not treat a different row with other data as a match", () => {
		expect(
			isValueInAvailableItems(
				JSON.stringify(itemsData.a.data),
				["b"],
				itemsData,
			),
		).toBe(false);
	});

	it("matches a stored JSON value whose keys are in another order", () => {
		// the model may return the data mapping with reordered keys after a
		// computation: the stored value still belongs to the same row
		const reordered = JSON.stringify({color: "Red", category: "Fabric"});
		expect(isValueInAvailableItems(reordered, ["a", "b"], itemsData)).toBe(
			true,
		);
		expect(
			resolveDisplayValueForCards(reordered, ["a", "b"], itemsData),
		).toBe("a");
	});

	it("does not match a JSON value with other content in another order", () => {
		const other = JSON.stringify({color: "Blue", category: "Fabric"});
		expect(isValueInAvailableItems(other, ["a"], itemsData)).toBe(false);
		expect(isValueInAvailableItems("not json", ["a"], itemsData)).toBe(
			false,
		);
	});

	describe("e-commerce itemKey path (source scrolling API)", () => {
		const ecommerceItems = ["Option 000", "Option 001", "Option 002"];

		it("highlights when the stored item key is in the current page", () => {
			expect(
				resolveDisplayValueForCards("Option 001", ecommerceItems),
			).toBe("Option 001");
		});

		it("returns undefined when search/filter removed the item without changing the parameter", () => {
			expect(
				resolveDisplayValueForCards("Option 042", ecommerceItems),
			).toBeUndefined();
		});

		it("matches by item key only, not displayname", () => {
			const withDisplay = {
				"Option 001": {displayname: "Blue fabric"},
			};
			expect(
				resolveDisplayValueForCards(
					"Blue fabric",
					ecommerceItems,
					withDisplay,
				),
			).toBeUndefined();
		});
	});
});
