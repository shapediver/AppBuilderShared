import {combinedSelectionNameFilter} from "../combinedSelectionNameFilter";

describe("combinedSelectionNameFilter", () => {
	it("keeps the parameter filter and every object filter", () => {
		expect(
			combinedSelectionNameFilter(
				["Boxes.*"],
				[{nameFilter: "Handles.1"}, {nameFilter: "Handles.2"}],
			),
		).toEqual(["Boxes.*", "Handles.1", "Handles.2"]);
	});

	it("is the object filters when the parameter filter is empty", () => {
		expect(
			combinedSelectionNameFilter(undefined, [{nameFilter: "Handles.1"}]),
		).toEqual(["Handles.1"]);
	});
});
