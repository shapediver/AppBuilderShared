import type {FilterTreeGroup} from "@AppBuilderLib/entities/parameter/model/filterableDatabase/useFilterableDatabase";
import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {buildFilterRenderSegments} from "../buildFilterRenderSegments";

const filterGroups: FilterTreeGroup[] = [
	{filterIndex: 0, label: "Name", type: "text", nodes: []},
	{filterIndex: 1, label: "Category", nodes: []},
	{filterIndex: 2, label: "Color", type: "color", nodes: []},
	{filterIndex: 3, label: "Material", nodes: []},
];

const filters: IFilterableDatabaseSettings["filters"] = [
	{column: 1, label: "Name", type: "text", inline: true},
	{column: 3, label: "Category", multiple: true},
	{column: 4, label: "Color", type: "color", multiple: true, inline: true},
	{column: 5, label: "Material", multiple: true},
];

describe("buildFilterRenderSegments", () => {
	it("preserves order with interleaved inline and accordion filters", () => {
		const segments = buildFilterRenderSegments(filterGroups, filters);

		expect(segments).toEqual([
			{kind: "inline", group: filterGroups[0]},
			{kind: "accordion", groups: [filterGroups[1]]},
			{kind: "inline", group: filterGroups[2]},
			{kind: "accordion", groups: [filterGroups[3]]},
		]);
	});

	it("batches consecutive accordion filters", () => {
		const allAccordionFilters: IFilterableDatabaseSettings["filters"] = [
			{column: 1, label: "Category", multiple: true},
			{column: 2, label: "Material", multiple: true},
		];
		const segments = buildFilterRenderSegments(
			filterGroups.slice(1, 3),
			allAccordionFilters,
		);

		expect(segments).toEqual([
			{kind: "accordion", groups: [filterGroups[1], filterGroups[2]]},
		]);
	});
});
