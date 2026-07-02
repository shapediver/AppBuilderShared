import {csvEngine} from "../csvEngine";

describe("csvEngine.parse", () => {
	it("parses simple rows", () => {
		const {rows} = csvEngine.parse("a,b\n1,2\n3,4\n");
		expect(rows).toEqual([
			["1", "2"],
			["3", "4"],
		]);
	});

	it("handles quoted commas", () => {
		const {rows} = csvEngine.parse('header1,"a,b"\ndata1,"a,b"\n');
		expect(rows).toEqual([["data1", "a,b"]]);
	});

	it("skips empty lines", () => {
		const {rows} = csvEngine.parse("a,b\n\n1,2\n");
		expect(rows).toEqual([["1", "2"]]);
	});

	it("handles escaped quotes", () => {
		const {rows} = csvEngine.parse('"greeting","col"\n"say ""hi""",b\n');
		expect(rows).toEqual([['say "hi"', "b"]]);
	});

	it("skips first row as header", () => {
		const {rows} = csvEngine.parse("category,color\nShirts,Red\nPants,Blue\n");
		expect(rows).toEqual([
			["Shirts", "Red"],
			["Pants", "Blue"],
		]);
	});
});
