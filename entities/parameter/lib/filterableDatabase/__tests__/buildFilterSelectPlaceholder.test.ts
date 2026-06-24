import {buildFilterSelectPlaceholder} from "../buildFilterSelectPlaceholder";

describe("buildFilterSelectPlaceholder", () => {
	it("returns default placeholder when no filters are active", () => {
		expect(buildFilterSelectPlaceholder(0)).toBe("Filters");
	});

	it("uses a custom placeholder when provided", () => {
		expect(buildFilterSelectPlaceholder(0, "Refine results")).toBe(
			"Refine results",
		);
	});

	it("summarizes a single active filter", () => {
		expect(buildFilterSelectPlaceholder(1)).toBe("1 filter active");
	});

	it("summarizes multiple active filters", () => {
		expect(buildFilterSelectPlaceholder(3)).toBe("3 filters active");
	});
});
