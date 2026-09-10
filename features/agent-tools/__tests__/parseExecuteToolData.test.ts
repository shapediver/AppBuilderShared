import {parseExecuteToolData} from "../lib/parseExecuteToolData";

describe("parseExecuteToolData", () => {
	it("returns undefined for undefined data", () => {
		expect(parseExecuteToolData(undefined)).toBeUndefined();
	});

	it("returns undefined for null data", () => {
		expect(parseExecuteToolData(null)).toBeUndefined();
	});

	it("returns undefined for an empty object", () => {
		expect(parseExecuteToolData({})).toBeUndefined();
	});

	it("returns undefined when name is not a string", () => {
		expect(parseExecuteToolData({name: 1})).toBeUndefined();
	});

	it("returns name and input for a valid payload", () => {
		expect(
			parseExecuteToolData({
				name: "get_screenshot",
				input: {viewportId: "vp"},
			}),
		).toEqual({
			name: "get_screenshot",
			input: {viewportId: "vp"},
		});
	});

	it("returns name with undefined input when input is omitted", () => {
		expect(parseExecuteToolData({name: "get_screenshot"})).toEqual({
			name: "get_screenshot",
			input: undefined,
		});
	});
});
