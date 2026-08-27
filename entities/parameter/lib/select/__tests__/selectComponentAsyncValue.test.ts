import {
	isValueInAvailableItems,
	resolveDisplayValueForCards,
	resolveItemKeyForValue,
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

	it("isValueInAvailableItems matches JSON data among several visible keys", () => {
		expect(
			isValueInAvailableItems(
				JSON.stringify(itemsData.b.data),
				["a", "b"],
				itemsData,
			),
		).toBe(true);
	});

	it("resolveDisplayValueForCards returns empty and null values unchanged", () => {
		expect(resolveDisplayValueForCards("", ["a"], itemsData)).toBe("");
		expect(resolveDisplayValueForCards(null, ["a"], itemsData)).toBeNull();
		expect(
			resolveDisplayValueForCards(undefined, ["a"], itemsData),
		).toBeUndefined();
	});

	describe("resolveItemKeyForValue", () => {
		it("returns the item key when the stored value is already a key", () => {
			expect(resolveItemKeyForValue("a", ["a", "b"], itemsData)).toBe("a");
		});

		it("maps serialized item data to the matching visible key", () => {
			expect(
				resolveItemKeyForValue(
					JSON.stringify(itemsData.b.data),
					["a", "b"],
					itemsData,
				),
			).toBe("b");
		});

		it("returns the stored value when itemsData is omitted", () => {
			expect(resolveItemKeyForValue("missing", ["a"])).toBe("missing");
		});

		it("skips keys that are absent from itemsData", () => {
			expect(
				resolveItemKeyForValue(
					JSON.stringify(itemsData.b.data),
					["gone", "b"],
					itemsData,
				),
			).toBe("b");
		});
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
