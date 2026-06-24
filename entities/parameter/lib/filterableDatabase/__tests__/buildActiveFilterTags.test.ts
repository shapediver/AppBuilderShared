import type {FilterTreeGroup} from "../../../model/filterableDatabase/useFilterableDatabase";
import {buildActiveFilterTags} from "../buildActiveFilterTags";

const filterGroups: FilterTreeGroup[] = [
	{
		filterIndex: 0,
		label: "Filter 1",
		nodes: [{value: "Fabric", label: "Fabric"}],
	},
	{
		filterIndex: 1,
		label: "Filter 2",
		type: "color",
		nodes: [
			{value: "Red", label: "Red", color: "Red"},
			{value: "Blue", label: "Blue", color: "Blue"},
		],
	},
];

describe("buildActiveFilterTags", () => {
	it("returns empty array when nothing is selected", () => {
		expect(buildActiveFilterTags({}, filterGroups)).toEqual([]);
	});

	it("builds tags from selection with group labels", () => {
		expect(
			buildActiveFilterTags(
				{0: ["Fabric"], 1: ["Red", "Blue"]},
				filterGroups,
			),
		).toEqual([
			{
				filterIndex: 0,
				value: "Fabric",
				label: "Fabric",
				groupLabel: "Filter 1",
			},
			{
				filterIndex: 1,
				value: "Red",
				label: "Red",
				groupLabel: "Filter 2",
			},
			{
				filterIndex: 1,
				value: "Blue",
				label: "Blue",
				groupLabel: "Filter 2",
			},
		]);
	});

	it("ignores selections for unknown filter indices", () => {
		expect(buildActiveFilterTags({99: ["Ghost"]}, filterGroups)).toEqual(
			[],
		);
	});

	it("uses custom group labels from filterGroups", () => {
		const groups: FilterTreeGroup[] = [
			{
				filterIndex: 0,
				label: "Category",
				nodes: [{value: "Fabric", label: "Fabric"}],
			},
		];

		expect(buildActiveFilterTags({0: ["Fabric"]}, groups)).toEqual([
			{
				filterIndex: 0,
				value: "Fabric",
				label: "Fabric",
				groupLabel: "Category",
			},
		]);
	});
});
