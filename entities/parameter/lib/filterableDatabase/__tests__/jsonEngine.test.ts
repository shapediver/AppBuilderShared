import {jsonEngine} from "../jsonEngine";

describe("jsonEngine.parse", () => {
	it("parses valid JSON with rows", () => {
		const raw = JSON.stringify({
			columns: ["id", "name", "category", "color"],
			rows: [
				["1", "Red Cotton", "Fabric", "Red"],
				["2", "Blue Wool", "Fabric", "Blue"],
			],
		});
		const {rows} = jsonEngine.parse(raw);
		expect(rows).toEqual([
			["1", "Red Cotton", "Fabric", "Red"],
			["2", "Blue Wool", "Fabric", "Blue"],
		]);
	});

	it("coerces non-string cells", () => {
		const raw = `{"rows":[[1,true,null],[2.5,false,"text"]]}`;
		const {rows} = jsonEngine.parse(raw);
		expect(rows).toEqual([
			["1", "true", "null"],
			["2.5", "false", "text"],
		]);
	});

	it("rejects missing rows", () => {
		expect(() =>
			jsonEngine.parse(JSON.stringify({columns: ["a"]})),
		).toThrow(/missing "rows"/i);
	});

	it("rejects invalid rows (not an array)", () => {
		expect(() => jsonEngine.parse(JSON.stringify({rows: "bad"}))).toThrow(
			/"rows" must be an array/i,
		);
	});

	it("rejects non-array row entries", () => {
		expect(() =>
			jsonEngine.parse(JSON.stringify({rows: [["a"], "not-a-row"]})),
		).toThrow(/row at index 1 must be an array/i);
	});

	it("rejects invalid JSON", () => {
		expect(() => jsonEngine.parse("{not json")).toThrow(/invalid json/i);
	});
});
