import {filterNodesBySearch} from "@AppBuilderLib/entities/parameter/lib/filterableDatabase/filterLogic";
import type {FilterTreeGroup} from "@AppBuilderLib/entities/parameter/model/filterableDatabase/useFilterableDatabase";
import {
	Accordion,
	Radio,
	Stack,
	Text,
	TextInput,
	type CheckboxProps,
	type ColorSwatchProps,
	type GroupProps,
	type RadioProps,
	type StackProps,
	type TextInputProps,
	type TextProps,
} from "@mantine/core";
import {FilterableDatabaseFilterOption} from "./FilterableDatabaseFilterOption";

export interface FilterableDatabaseFilterGroupStyleProps {
	stackProps?: StackProps;
	checkboxProps?: CheckboxProps;
	radioProps?: RadioProps;
	textInputProps?: TextInputProps;
	labelTextProps?: Omit<TextProps, "children">;
	optionGroupProps?: Omit<GroupProps, "children">;
	optionLabelTextProps?: Omit<TextProps, "children">;
	optionColorSwatchProps?: Omit<ColorSwatchProps, "color">;
}

export interface FilterableDatabaseFilterGroupProps extends FilterableDatabaseFilterGroupStyleProps {
	group: FilterTreeGroup;
	selectedValues: string[];
	multiple: boolean;
	searchTerm?: string;
	onToggle: (filterIndex: number, value: string) => void;
	onSetFilterText: (filterIndex: number, text: string) => void;
}

export function FilterableDatabaseFilterGroup(
	props: FilterableDatabaseFilterGroupProps,
) {
	const {
		group,
		selectedValues,
		multiple,
		searchTerm = "",
		onToggle,
		onSetFilterText,
		stackProps,
		checkboxProps,
		radioProps,
		textInputProps,
		labelTextProps,
		optionGroupProps,
		optionLabelTextProps,
		optionColorSwatchProps,
	} = props;

	const visibleNodes =
		group.type === "text"
			? []
			: filterNodesBySearch(group.nodes, searchTerm);

	const options = visibleNodes.map((node) => (
		<FilterableDatabaseFilterOption
			key={node.value}
			filterIndex={group.filterIndex}
			value={node.value}
			label={node.label}
			checked={selectedValues.includes(node.value)}
			multiple={multiple}
			groupType={group.type === "color" ? "color" : undefined}
			color={node.color}
			onToggle={onToggle}
			checkboxProps={checkboxProps}
			radioProps={radioProps}
			groupProps={optionGroupProps}
			labelTextProps={optionLabelTextProps}
			colorSwatchProps={optionColorSwatchProps}
		/>
	));

	return (
		<Accordion.Item value={String(group.filterIndex)}>
			<Accordion.Control>
				<Text {...labelTextProps}>{group.label}</Text>
			</Accordion.Control>
			<Accordion.Panel>
				<Stack {...stackProps}>
					{group.type === "text" ? (
						<TextInput
							value={selectedValues[0] ?? ""}
							onChange={(event) =>
								onSetFilterText(
									group.filterIndex,
									event.currentTarget.value,
								)
							}
							{...textInputProps}
						/>
					) : multiple ? (
						options
					) : (
						<Radio.Group
							value={selectedValues[0] ?? ""}
							onChange={(nextValue) =>
								onToggle(group.filterIndex, nextValue)
							}
						>
							{options}
						</Radio.Group>
					)}
				</Stack>
			</Accordion.Panel>
		</Accordion.Item>
	);
}
