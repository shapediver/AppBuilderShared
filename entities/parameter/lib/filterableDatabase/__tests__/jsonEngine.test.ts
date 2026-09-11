import {jsonEngine} from "../jsonEngine";

describe("jsonEngine.parse", () => {
	it("parses object rows matching itemDataDefinition (custom fields in data)", () => {
		const raw = JSON.stringify({
			columns: [
				"value",
				"displayname",
				"imageUrl",
				"category",
				"color",
				"materials",
			],
			rows: [
				{
					value: "Option 1",
					displayname: "Red Cotton",
					imageUrl: "https://example.com/r.png",
					data: {
						category: "Fabric",
						color: "Red",
						materials: "Cotton",
					},
				},
				{
					value: "Option 2",
					displayname: "Blue Wool",
					data: {
						category: "Fabric",
						color: "Blue",
						materials: "Wool",
					},
				},
			],
		});
		const {rows} = jsonEngine.parse(raw);
		expect(rows).toEqual([
			[
				"Option 1",
				"Red Cotton",
				"https://example.com/r.png",
				"Fabric",
				"Red",
				"Cotton",
			],
			["Option 2", "Blue Wool", "", "Fabric", "Blue", "Wool"],
		]);
	});

	it("joins multivalued data arrays with semicolons", () => {
		const raw = JSON.stringify({
			columns: ["value", "displayname", "category", "color", "materials"],
			rows: [
				{
					value: "Option 5",
					displayname: "Navy Blend",
					data: {
						category: "Blend",
						color: "Navy",
						materials: ["Cotton", "Linen"],
					},
				},
			],
		});
		const {rows} = jsonEngine.parse(raw);
		expect(rows).toEqual([
			["Option 5", "Navy Blend", "Blend", "Navy", "Cotton;Linen"],
		]);
	});

	it("infers columns from top-level fields and nested data keys", () => {
		const raw = JSON.stringify({
			rows: [
				{
					value: "A",
					displayname: "Alpha",
					data: {category: "Fabric", materials: ["Cotton"]},
				},
			],
		});
		const {rows} = jsonEngine.parse(raw);
		expect(rows).toEqual([["A", "Alpha", "Fabric", "Cotton"]]);
	});

	it("infers and parses arbitrary top-level fields (e.g. sku)", () => {
		const raw = JSON.stringify({
			rows: [
				{
					value: "A",
					sku: "SKU-001",
					displayname: "Alpha",
					data: {category: "Fabric"},
				},
				{
					value: "B",
					sku: "SKU-002",
					data: {category: "Blend"},
				},
			],
		});
		const {rows} = jsonEngine.parse(raw);
		// value first, then first-seen top-level keys (sku, displayname),
		// then sorted data keys (category).
		expect(rows).toEqual([
			["A", "SKU-001", "Alpha", "Fabric"],
			["B", "SKU-002", "", "Blend"],
		]);
	});

	it("reads arbitrary data keys not in any known field whitelist", () => {
		const raw = JSON.stringify({
			rows: [
				{
					value: "A",
					data: {weight: 120, origin: "EU"},
				},
			],
		});
		const {rows} = jsonEngine.parse(raw);
		// data keys sorted alphabetically: origin, weight
		expect(rows).toEqual([["A", "EU", "120"]]);
	});

	it("parses array rows (string[][])", () => {
		const raw = JSON.stringify({
			columns: ["value", "displayname", "category", "color"],
			rows: [
				["Option 1", "Red Cotton", "Fabric", "Red"],
				["Option 2", "Blue Wool", "Fabric", "Blue"],
			],
		});
		const {rows} = jsonEngine.parse(raw);
		expect(rows).toEqual([
			["Option 1", "Red Cotton", "Fabric", "Red"],
			["Option 2", "Blue Wool", "Fabric", "Blue"],
		]);
	});

	it("coerces non-string cell values", () => {
		const raw = JSON.stringify({
			columns: ["value", "displayname", "count"],
			rows: [{value: 1, displayname: true, data: {count: null}}],
		});
		const {rows} = jsonEngine.parse(raw);
		expect(rows).toEqual([["1", "true", "null"]]);
	});

	it("rejects missing rows", () => {
		expect(() =>
			jsonEngine.parse(JSON.stringify({columns: ["value"]})),
		).toThrow(/missing "rows"/i);
	});

	it("rejects empty rows array", () => {
		expect(() => jsonEngine.parse(JSON.stringify({rows: []}))).toThrow(
			/must not be empty/i,
		);
	});

	it("rejects object row without value", () => {
		expect(() =>
			jsonEngine.parse(
				JSON.stringify({rows: [{displayname: "No value field"}]}),
			),
		).toThrow(/missing "value"/i);
	});

	it("rejects a later object row that is missing value", () => {
		expect(() =>
			jsonEngine.parse(
				JSON.stringify({
					rows: [{value: "A"}, {displayname: "No value field"}],
				}),
			),
		).toThrow(/missing "value"/i);
	});

	it("rejects invalid row entries", () => {
		expect(() =>
			jsonEngine.parse(JSON.stringify({rows: [{value: "A"}, "bad"]})),
		).toThrow(/must be an object or array/i);
	});

	it("rejects invalid JSON", () => {
		expect(() => jsonEngine.parse("{not json")).toThrow(/invalid json/i);
	});

	it("rejects a JSON array or null document", () => {
		expect(() => jsonEngine.parse("[]")).toThrow(
			/must be an object with a rows array/i,
		);
		expect(() => jsonEngine.parse("null")).toThrow(
			/must be an object with a rows array/i,
		);
	});

	it("rejects rows that are not an array", () => {
		expect(() =>
			jsonEngine.parse(JSON.stringify({rows: {value: "A"}})),
		).toThrow(/"rows" must be an array/i);
	});

	it("rejects columns that omit value", () => {
		expect(() =>
			jsonEngine.parse(
				JSON.stringify({
					columns: ["displayname"],
					rows: [{value: "A", displayname: "Alpha"}],
				}),
			),
		).toThrow(/must include "value"/i);
	});

	it("rejects a non-array row when rows start as arrays", () => {
		expect(() =>
			jsonEngine.parse(
				JSON.stringify({
					rows: [["Option 1"], {value: "Option 2"}],
				}),
			),
		).toThrow(/must be an array/i);
	});

	it("drops empty and whitespace-only array items when joining", () => {
		const raw = JSON.stringify({
			columns: ["value", "materials"],
			rows: [{value: "A", data: {materials: ["Cotton", "  ", "Linen"]}}],
		});
		expect(jsonEngine.parse(raw).rows).toEqual([["A", "Cotton;Linen"]]);
	});

	it("puts value first even when it is not the first key on the object", () => {
		const raw = JSON.stringify({
			rows: [{displayname: "Alpha", value: "A", data: {z: "Z", a: "A"}}],
		});
		expect(jsonEngine.parse(raw).rows).toEqual([["A", "Alpha", "A", "Z"]]);
	});

	it("ignores a non-object data field when inferring columns", () => {
		const raw = JSON.stringify({
			rows: [
				{value: "A", data: {category: "Fabric"}},
				{value: "B", data: "not-an-object"},
			],
		});
		expect(jsonEngine.parse(raw).rows).toEqual([
			["A", "Fabric"],
			["B", ""],
		]);
	});

	it("does not stringify the nested data object as a column", () => {
		const raw = JSON.stringify({
			columns: ["value", "data"],
			rows: [{value: "A", data: {category: "Fabric"}}],
		});
		expect(jsonEngine.parse(raw).rows).toEqual([["A", ""]]);
	});

	it("reads nested data without throwing when data is null", () => {
		const raw = JSON.stringify({
			columns: ["value", "category"],
			rows: [{value: "A", data: null}],
		});
		expect(jsonEngine.parse(raw).rows).toEqual([["A", ""]]);
	});

	it("fetch returns the response body", async () => {
		const spy = jest.spyOn(global, "fetch").mockResolvedValue({
			ok: true,
			text: async () => "raw-json",
		} as Response);

		await expect(
			jsonEngine.fetch("https://example.com/a.json"),
		).resolves.toBe("raw-json");
		spy.mockRestore();
	});
});
