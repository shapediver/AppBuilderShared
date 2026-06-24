import type {FilterTreeGroup} from "@AppBuilderLib/entities/parameter/model/filterableDatabase/useFilterableDatabase";
import {
	Accordion,
	Stack,
	Text,
	type CheckboxProps,
	type StackProps,
} from "@mantine/core";
import {FilterableDatabaseFilterOption} from "./FilterableDatabaseFilterOption";

export interface FilterableDatabaseFilterGroupStyleProps {
	stackProps?: StackProps;
	checkboxProps?: CheckboxProps;
}

export interface FilterableDatabaseFilterGroupProps extends FilterableDatabaseFilterGroupStyleProps {
	group: FilterTreeGroup;
	selectedValues: string[];
	multiple: boolean;
	onToggle: (filterIndex: number, value: string) => void;
}

export function FilterableDatabaseFilterGroup(
	props: FilterableDatabaseFilterGroupProps,
) {
	const {group, selectedValues, onToggle, stackProps, checkboxProps} = props;

	return (
		<Accordion.Item value={String(group.filterIndex)}>
			<Accordion.Control>
				<Text fw={500} size="sm">
					{group.label}
				</Text>
			</Accordion.Control>
			<Accordion.Panel>
				<Stack gap="sm" {...stackProps}>
					{group.nodes.map((node) => (
						<FilterableDatabaseFilterOption
							key={node.value}
							filterIndex={group.filterIndex}
							value={node.value}
							label={node.label}
							checked={selectedValues.includes(node.value)}
							groupType={group.type}
							color={node.color}
							onToggle={onToggle}
							checkboxProps={checkboxProps}
						/>
					))}
				</Stack>
			</Accordion.Panel>
		</Accordion.Item>
	);
}
