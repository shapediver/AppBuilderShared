import type {FilterTreeGroup} from "@AppBuilderLib/entities/parameter/model/filterableDatabase/useFilterableDatabase";
import {
	Accordion,
	Stack,
	Text,
	type CheckboxProps,
	type ColorSwatchProps,
	type GroupProps,
	type StackProps,
	type TextProps,
} from "@mantine/core";
import {FilterableDatabaseFilterOption} from "./FilterableDatabaseFilterOption";

export interface FilterableDatabaseFilterGroupStyleProps {
	stackProps?: StackProps;
	checkboxProps?: CheckboxProps;
	labelTextProps?: Omit<TextProps, "children">;
	optionGroupProps?: Omit<GroupProps, "children">;
	optionLabelTextProps?: Omit<TextProps, "children">;
	optionColorSwatchProps?: Omit<ColorSwatchProps, "color">;
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
	const {
		group,
		selectedValues,
		onToggle,
		stackProps,
		checkboxProps,
		labelTextProps,
		optionGroupProps,
		optionLabelTextProps,
		optionColorSwatchProps,
	} = props;

	return (
		<Accordion.Item value={String(group.filterIndex)}>
			<Accordion.Control>
				<Text {...labelTextProps}>{group.label}</Text>
			</Accordion.Control>
			<Accordion.Panel>
				<Stack {...stackProps}>
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
							groupProps={optionGroupProps}
							labelTextProps={optionLabelTextProps}
							colorSwatchProps={optionColorSwatchProps}
						/>
					))}
				</Stack>
			</Accordion.Panel>
		</Accordion.Item>
	);
}
