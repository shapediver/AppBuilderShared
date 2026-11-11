import {selectionAllowsSelect} from "../selectionAllowsSelect";

describe("selectionAllowsSelect", () => {
	it("does not admit a node when the maximum is 0 or below", () => {
		expect(selectionAllowsSelect(0)).toBe(false);
		expect(selectionAllowsSelect(-1)).toBe(false);
	});

	it("admits a node when the maximum is omitted or at least 1", () => {
		expect(selectionAllowsSelect(undefined)).toBe(true);
		expect(selectionAllowsSelect(1)).toBe(true);
		expect(selectionAllowsSelect(2)).toBe(true);
	});
});
