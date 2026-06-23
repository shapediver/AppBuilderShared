import {
	Checkbox,
	ColorSwatch,
	Group,
	Loader,
	RenderTreeNodePayload,
	Stack,
	Text,
	Tree,
	TreeNodeData,
	useTree,
} from "@mantine/core";
import React, {useEffect, useMemo} from "react";
import {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {useFilterableDatabase} from "../../model/filterableDatabase/useFilterableDatabase";
import {SelectComponentProps} from "./SelectComponent";
import SelectComponentAsync from "./SelectComponentAsync";

interface FilterableSelectComponentProps extends SelectComponentProps {
	database: IFilterableDatabaseSettings;
	type: "fullwidthcards" | "grid";
}

/**
 * Component that allows to filter a database and select an item from the filtered results.
 * It uses a Mantine Tree with checkboxes for filtering.
 */
export default function FilterableSelectComponent(
	props: FilterableSelectComponentProps,
) {
	const {database, type, ...rest} = props;

	const {
		loading,
		error,
		selection,
		toggleFilterValue,
		filterGroups,
		scrollingApi,
	} = useFilterableDatabase(database);

	const tree = useTree({multiple: true});

	// Build treeData from filterGroups
	const treeData = useMemo((): TreeNodeData[] => {
		return filterGroups.map((group, groupIndex) => ({
			label: group.label,
			value: `group-${groupIndex}`,
			children: group.nodes.map((node) => ({
				label: node.label,
				value: `${groupIndex}::${node.value}`,
				// Add color and group type to nodeProps for rendering
				nodeProps: {
					color: node.color,
					groupType: group.type,
				},
			})),
		}));
	}, [filterGroups]);

	// Sync checked state from selection to Tree
	useEffect(() => {
		const checkedState: string[] = [];
		Object.entries(selection).forEach(([groupIndex, values]) => {
			values.forEach((value) => {
				checkedState.push(`${groupIndex}::${value}`);
			});
		});
		tree.setCheckedState(checkedState);
	}, [selection, tree]);

	const renderNode = ({
		node,
		hasChildren,
		elementProps,
		tree: treeInstance,
	}: RenderTreeNodePayload) => {
		const isLeaf = !hasChildren;
		const nodeProps = node.nodeProps as
			| {color?: string; groupType?: string}
			| undefined;

		return (
			<Group gap="xs" {...elementProps}>
				{isLeaf && (
					<Checkbox.Indicator
						checked={treeInstance.isNodeChecked(node.value)}
						onClick={(e) => {
							e.stopPropagation();
							const [groupIndexStr, value] = node.value.split("::");
							toggleFilterValue(parseInt(groupIndexStr), value);
						}}
					/>
				)}
				<Group
					gap={5}
					onClick={() => !isLeaf && treeInstance.toggleExpanded(node.value)}
					style={{cursor: isLeaf ? "default" : "pointer"}}
				>
					{nodeProps?.groupType === "color" && nodeProps.color && (
						<ColorSwatch color={nodeProps.color} size={16} />
					)}
					<Text size="sm">{node.label}</Text>
				</Group>
			</Group>
		);
	};

	if (loading) {
		return (
			<Group justify="center" p="md">
				<Loader />
			</Group>
		);
	}

	if (error) {
		return (
			<Text c="red" p="md">
				{error.message}
			</Text>
		);
	}

	return (
		<Stack gap="md">
			<Tree
				data={treeData}
				tree={tree}
				renderNode={renderNode}
				levelOffset={23}
				expandOnClick={false}
			/>
			{scrollingApi && (
				<SelectComponentAsync
					{...rest}
					type={type}
					scrollingApi={scrollingApi}
				/>
			)}
		</Stack>
	);
}
