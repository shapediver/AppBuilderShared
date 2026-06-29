import {jsonEngine} from "../jsonEngine";

describe("jsonEngine.parse", () => {
	it("parses rows as objects with value and title fields", () => {
		const raw = JSON.stringify({
			columns: ["value", "title", "category", "color"],
			rows: [
				{
					value: "Option 1",
					title: "Red Cotton",
					category: "Fabric",
					color: "Red",
				},
				{
					value: "Option 2",
					title: "Blue Wool",
					category: "Fabric",
					color: "Blue",
				},
			],
		});
		const {rows} = jsonEngine.parse(raw);
		expect(rows).toEqual([
			["Option 1", "Red Cotton", "Fabric", "Red"],
			["Option 2", "Blue Wool", "Fabric", "Blue"],
		]);
	});

	it("joins array fields with semicolons for multivalued filters", () => {
		const raw = JSON.stringify({
			columns: ["value", "title", "tags"],
			rows: [
				{
					value: "Option 5",
					title: "Navy Blend",
					tags: ["Cotton", "Linen"],
				},
			],
		});
		const {rows} = jsonEngine.parse(raw);
		expect(rows).toEqual([["Option 5", "Navy Blend", "Cotton;Linen"]]);
	});

	it("accepts a top-level array of row objects", () => {
		const raw = JSON.stringify({
			columns: ["value", "title", "tags"],
			rows: [{value: "A", title: "Alpha", tags: ["Fabric"]}],
		});
		const {rows} = jsonEngine.parse(raw);
		expect(rows).toEqual([["A", "Alpha", "Fabric"]]);
	});

	it("coerces non-string cell values", () => {
		const raw = JSON.stringify({
			columns: ["value", "title", "count"],
			rows: [{value: 1, title: true, count: null}],
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

	it("rejects row without value", () => {
		expect(() =>
			jsonEngine.parse(
				JSON.stringify({rows: [{title: "No value field"}]}),
			),
		).toThrow(/missing "value"/i);
	});

	it("rejects non-object row entries", () => {
		expect(() =>
			jsonEngine.parse(JSON.stringify({rows: [{value: "A"}, "bad"]})),
		).toThrow(/must be an object/i);
	});

	it("rejects invalid JSON", () => {
		expect(() => jsonEngine.parse("{not json")).toThrow(/invalid json/i);
	});
});
