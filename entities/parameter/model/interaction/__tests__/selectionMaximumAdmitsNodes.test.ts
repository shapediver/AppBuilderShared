import {selectionMaximumAdmitsNodes} from "../selectionMaximumAdmitsNodes";

describe("selectionMaximumAdmitsNodes", () => {
	it("admits a node when the maximum is omitted or at least one", () => {
		expect(selectionMaximumAdmitsNodes(undefined)).toBe(true);
		expect(selectionMaximumAdmitsNodes(1)).toBe(true);
		expect(selectionMaximumAdmitsNodes(2)).toBe(true);
	});

	it("admits nothing when the maximum is below one", () => {
		expect(selectionMaximumAdmitsNodes(0)).toBe(false);
		expect(selectionMaximumAdmitsNodes(-1)).toBe(false);
	});
});
