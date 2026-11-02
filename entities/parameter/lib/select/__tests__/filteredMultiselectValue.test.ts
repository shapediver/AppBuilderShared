import {
	mergeFilteredMultiselectValue,
	visibleMultiselectValue,
} from "../filteredMultiselectValue";

describe("filteredMultiselectValue", () => {
	it("shows only the committed values that are currently on screen", () => {
		expect(
			visibleMultiselectValue(["Zwei", "Vier"], ["Eins", "Drei"]),
		).toEqual([]);
		expect(
			visibleMultiselectValue(
				["Zwei", "Vier"],
				["Zwei", "Vier", "Sechs"],
			),
		).toEqual(["Zwei", "Vier"]);
	});

	it("keeps a selection the current filter hides when the user adds a shown row", () => {
		expect(
			mergeFilteredMultiselectValue(
				["Zwei", "Vier"],
				["Eins", "Drei"],
				["Eins"],
			),
		).toEqual(["Zwei", "Vier", "Eins"]);
	});

	it("drops a shown row the user deselects and keeps hidden ones", () => {
		expect(
			mergeFilteredMultiselectValue(
				["Zwei", "Eins"],
				["Eins", "Drei"],
				["Drei"],
			),
		).toEqual(["Zwei", "Drei"]);
	});

	it("does not duplicate a value the widget echoes back", () => {
		expect(
			mergeFilteredMultiselectValue(["Eins", "Zwei"], ["Eins"], ["Eins"]),
		).toEqual(["Zwei", "Eins"]);
	});
});
