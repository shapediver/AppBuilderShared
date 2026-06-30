import {resolveStringSelectEmitValue} from "../resolveStringSelectEmitValue";

describe("resolveStringSelectEmitValue", () => {
	it("uses itemData for filterable database configs", () => {
		expect(
			resolveStringSelectEmitValue({
				type: "grid",
				database: {
					dataSource: {href: "/sample.csv"},
					itemDataDefinition: {
						value: 0,
						displayname: 1,
						data: {category: 2},
					},
					filters: [{column: 1, label: "Name"}],
				},
			}),
		).toBe("itemData");
	});

	it("uses itemKey for e-commerce source without database", () => {
		expect(
			resolveStringSelectEmitValue({
				type: "grid",
				source: "graphics",
			}),
		).toBe("itemKey");
	});

	it("prefers database over source when both are set", () => {
		expect(
			resolveStringSelectEmitValue({
				type: "grid",
				source: "graphics",
				database: {
					dataSource: {href: "/sample.csv"},
					itemDataDefinition: {value: 0, displayname: 1},
					filters: [{column: 1, label: "Name"}],
				},
			}),
		).toBe("itemData");
	});
});
