import {csvEngine} from "../csvEngine";

describe("csvEngine.parse", () => {
	it("parses simple rows", () => {
		const {rows} = csvEngine.parse("a,b\n1,2\n3,4\n");
		expect(rows).toEqual([
			["a", "b"],
			["1", "2"],
			["3", "4"],
		]);
	});

	it("handles quoted commas", () => {
		const {rows} = csvEngine.parse('x,"a,b"\n');
		expect(rows).toEqual([["x", "a,b"]]);
	});

	it("skips empty lines", () => {
		const {rows} = csvEngine.parse("a,b\n\n1,2\n");
		expect(rows).toEqual([
			["a", "b"],
			["1", "2"],
		]);
	});

	it("handles escaped quotes", () => {
		const {rows} = csvEngine.parse('"say ""hi""",b\n');
		expect(rows).toEqual([['say "hi"', "b"]]);
	});
});
