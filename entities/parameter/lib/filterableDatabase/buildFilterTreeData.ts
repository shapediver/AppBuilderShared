import type {FilterTreeGroup} from "@AppBuilderLib/entities/parameter/model/filterableDatabase/useFilterableDatabase";
import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {TreeNodeData} from "@mantine/core";
import {filterNodesBySearch} from "./filterLogic";

export interface FilterGroupTreeNodeMeta {
	kind: "group";
	filterIndex: number;
	groupLabel: string;
	groupType?: "color" | "text";
	multiple: boolean;
	showSelectAll: boolean;
	allValues: string[];
}

export interface FilterOptionTreeNodeMeta {
	kind: "option";
	filterIndex: number;
	optionValue: string;
	optionLabel: string;
	color?: string;
	groupType?: "color";
	multiple: boolean;
}

export interface FilterTextInputTreeNodeMeta {
	kind: "text-input";
	filterIndex: number;
}

export type FilterTreeNodeMeta =
	| FilterGroupTreeNodeMeta
	| FilterOptionTreeNodeMeta
	| FilterTextInputTreeNodeMeta;

export function filterGroupNodeId(filterIndex: number): string {
	return `filter-${filterIndex}`;
}

export function filterOptionNodeId(
	filterIndex: number,
	optionValue: string,
): string {
	return `filter-${filterIndex}-option-${optionValue}`;
}

export function filterTextInputNodeId(filterIndex: number): string {
	return `filter-${filterIndex}-text-input`;
}

export function buildFilterTreeData(
	filterGroups: FilterTreeGroup[],
	filters: IFilterableDatabaseSettings["filters"],
	searchTerm = "",
): TreeNodeData[] {
	return filterGroups.map((group) => {
		const filter = filters[group.filterIndex];
		const multiple = filter?.multiple ?? true;
		const allValues = group.nodes.map((node) => node.value);
		const showSelectAll = multiple && group.type !== "text";

		const groupNode: TreeNodeData = {
			value: filterGroupNodeId(group.filterIndex),
			label: group.label,
			nodeProps: {
				kind: "group",
				filterIndex: group.filterIndex,
				groupLabel: group.label,
				groupType: group.type,
				multiple,
				showSelectAll,
				allValues,
			} satisfies FilterGroupTreeNodeMeta,
			children: [],
		};

		if (group.type === "text") {
			groupNode.children = [
				{
					value: filterTextInputNodeId(group.filterIndex),
					label: "",
					nodeProps: {
						kind: "text-input",
						filterIndex: group.filterIndex,
					} satisfies FilterTextInputTreeNodeMeta,
				},
			];
			return groupNode;
		}

		const visibleNodes = filterNodesBySearch(group.nodes, searchTerm);
		groupNode.children = visibleNodes.map((node) => ({
			value: filterOptionNodeId(group.filterIndex, node.value),
			label: node.label,
			nodeProps: {
				kind: "option",
				filterIndex: group.filterIndex,
				optionValue: node.value,
				optionLabel: node.label,
				color: node.color,
				groupType: group.type === "color" ? "color" : undefined,
				multiple,
			} satisfies FilterOptionTreeNodeMeta,
		}));

		return groupNode;
	});
}

export function getFilterTreeNodeMeta(
	node: TreeNodeData,
): FilterTreeNodeMeta | undefined {
	return node.nodeProps as FilterTreeNodeMeta | undefined;
}
