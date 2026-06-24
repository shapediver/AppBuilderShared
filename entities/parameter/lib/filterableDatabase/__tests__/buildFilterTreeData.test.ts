import type {FilterTreeGroup} from "@AppBuilderLib/entities/parameter/model/filterableDatabase/useFilterableDatabase";
import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	buildFilterTreeData,
	filterGroupNodeId,
	filterOptionNodeId,
	filterTextInputNodeId,
	getFilterTreeNodeMeta,
} from "../buildFilterTreeData";

const filterGroups: FilterTreeGroup[] = [
	{
		filterIndex: 0,
		label: "Name",
		type: "text",
		nodes: [],
	},
	{
		filterIndex: 1,
		label: "Category",
		nodes: [
			{value: "Fabric", label: "Fabric"},
			{value: "Leather", label: "Leather"},
		],
	},
	{
		filterIndex: 2,
		label: "Color",
		type: "color",
		nodes: [
			{value: "Red", label: "Red", color: "Red"},
			{value: "Blue", label: "Blue", color: "Blue"},
		],
	},
];

const filters: IFilterableDatabaseSettings["filters"] = [
	{column: 1, label: "Name", type: "text"},
	{column: 3, label: "Category", multiple: true},
	{column: 4, label: "Color", type: "color", multiple: true},
];

describe("buildFilterTreeData", () => {
	it("creates one parent node per filter group", () => {
		const tree = buildFilterTreeData(filterGroups, filters);
		expect(tree).toHaveLength(3);
		expect(tree.map((node) => node.value)).toEqual([
			filterGroupNodeId(0),
			filterGroupNodeId(1),
			filterGroupNodeId(2),
		]);
	});

	it("creates option children for tag filter groups", () => {
		const tree = buildFilterTreeData(filterGroups, filters);
		const categoryGroup = tree[1];
		expect(categoryGroup.children).toHaveLength(2);
		expect(categoryGroup.children?.[0]?.value).toBe(
			filterOptionNodeId(1, "Fabric"),
		);
	});

	it("narrows option children when searchTerm matches labels", () => {
		const tree = buildFilterTreeData(filterGroups, filters, "fab");
		const categoryGroup = tree[1];
		expect(categoryGroup.children).toHaveLength(1);
		expect(categoryGroup.children?.[0]?.value).toBe(
			filterOptionNodeId(1, "Fabric"),
		);
	});

	it("gives text filter groups a text-input child and no option children", () => {
		const tree = buildFilterTreeData(filterGroups, filters);
		const nameGroup = tree[0];
		expect(nameGroup.children).toHaveLength(1);
		expect(nameGroup.children?.[0]?.value).toBe(filterTextInputNodeId(0));
		const meta = getFilterTreeNodeMeta(nameGroup.children![0]!);
		expect(meta?.kind).toBe("text-input");
	});

	it("marks multi-select tag groups for select-all on the title row", () => {
		const tree = buildFilterTreeData(filterGroups, filters);
		const categoryMeta = getFilterTreeNodeMeta(tree[1]!) as {
			showSelectAll: boolean;
		};
		expect(categoryMeta.showSelectAll).toBe(true);
	});
});
