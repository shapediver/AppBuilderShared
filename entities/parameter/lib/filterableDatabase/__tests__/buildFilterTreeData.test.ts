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

describe("filter tree node ids", () => {
	it("builds stable ids from filter index and option value", () => {
		expect(filterGroupNodeId(0)).toBe("filter-0");
		expect(filterOptionNodeId(1, "Fabric")).toBe("filter-1-option-Fabric");
		expect(filterTextInputNodeId(2)).toBe("filter-2-text-input");
	});
});

describe("buildFilterTreeData", () => {
	it("creates one parent node per filter group", () => {
		const tree = buildFilterTreeData(filterGroups, filters);
		expect(tree).toHaveLength(3);
		expect(tree.map((node) => node.value)).toEqual([
			"filter-0",
			"filter-1",
			"filter-2",
		]);
	});

	it("creates option children for tag filter groups", () => {
		const tree = buildFilterTreeData(filterGroups, filters);
		const categoryGroup = tree[1];
		expect(categoryGroup.children).toHaveLength(2);
		expect(categoryGroup.children?.[0]?.value).toBe(
			"filter-1-option-Fabric",
		);
		expect(getFilterTreeNodeMeta(categoryGroup.children![0]!)).toEqual({
			kind: "option",
			filterIndex: 1,
			optionValue: "Fabric",
			optionLabel: "Fabric",
			color: undefined,
			groupType: undefined,
			multiple: true,
		});
	});

	it("marks color option nodes with groupType color", () => {
		const tree = buildFilterTreeData(filterGroups, filters);
		expect(getFilterTreeNodeMeta(tree[2]!.children![0]!)).toMatchObject({
			kind: "option",
			optionValue: "Red",
			optionLabel: "Red",
			color: "Red",
			groupType: "color",
			multiple: true,
		});
	});

	it("narrows option children when searchTerm matches labels", () => {
		const tree = buildFilterTreeData(filterGroups, filters, "fab");
		const categoryGroup = tree[1];
		expect(categoryGroup.children).toHaveLength(1);
		expect(categoryGroup.children?.[0]?.value).toBe(
			"filter-1-option-Fabric",
		);
	});

	it("gives text filter groups a text-input child and no option children", () => {
		const tree = buildFilterTreeData(filterGroups, filters);
		const nameGroup = tree[0];
		expect(nameGroup.children).toHaveLength(1);
		expect(nameGroup.children?.[0]?.value).toBe("filter-0-text-input");
		const meta = getFilterTreeNodeMeta(nameGroup.children![0]!);
		expect(meta?.kind).toBe("text-input");
		expect(getFilterTreeNodeMeta(nameGroup)).toMatchObject({
			kind: "group",
			showSelectAll: false,
			allValues: [],
			multiple: true,
			groupType: "text",
		});
	});

	it("marks multi-select tag groups for select-all on the title row", () => {
		const tree = buildFilterTreeData(filterGroups, filters);
		const categoryMeta = getFilterTreeNodeMeta(tree[1]!);
		expect(categoryMeta).toMatchObject({
			kind: "group",
			showSelectAll: true,
			allValues: ["Fabric", "Leather"],
			multiple: true,
		});
	});

	it("hides select-all for single-select tag groups", () => {
		const tree = buildFilterTreeData(filterGroups, [
			filters[0]!,
			{column: 3, label: "Category", multiple: false},
			filters[2]!,
		]);
		expect(getFilterTreeNodeMeta(tree[1]!)).toMatchObject({
			multiple: false,
			showSelectAll: false,
		});
	});

	it("defaults missing filter definitions to multi-select", () => {
		const tree = buildFilterTreeData(
			[
				{
					filterIndex: 99,
					label: "Orphan",
					nodes: [{value: "A", label: "A"}],
				},
			],
			[],
		);
		expect(getFilterTreeNodeMeta(tree[0]!)).toMatchObject({
			multiple: true,
			showSelectAll: true,
			allValues: ["A"],
		});
	});
});
