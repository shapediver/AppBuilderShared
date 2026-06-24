import {
	filterNodesBySearch,
	getSelectAllState,
} from "@AppBuilderLib/entities/parameter/lib/filterableDatabase/filterLogic";
import type {FilterTreeGroup} from "@AppBuilderLib/entities/parameter/model/filterableDatabase/useFilterableDatabase";
import {
	Accordion,
	Checkbox,
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
import {useCallback, type MouseEvent} from "react";
import {FilterableDatabaseFilterOption} from "./FilterableDatabaseFilterOption";
import classes from "./FilterableDatabaseFilters.module.css";

export interface FilterableDatabaseFilterGroupStyleProps {
	stackProps?: StackProps;
	checkboxProps?: CheckboxProps;
	selectAllCheckboxProps?: CheckboxProps;
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
	onToggleSelectAll: (filterIndex: number) => void;
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
		onToggleSelectAll,
		onSetFilterText,
		stackProps,
		checkboxProps,
		selectAllCheckboxProps,
		radioProps,
		textInputProps,
		labelTextProps,
		optionGroupProps,
		optionLabelTextProps,
		optionColorSwatchProps,
	} = props;

	const stopAccordionToggle = useCallback((event: MouseEvent) => {
		event.stopPropagation();
	}, []);

	const visibleNodes =
		group.type === "text"
			? []
			: filterNodesBySearch(group.nodes, searchTerm);

	const allValues = group.nodes.map((node) => node.value);
	const selectAllState = getSelectAllState(selectedValues, allValues);
	const showSelectAll = multiple && group.type !== "text";

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
				<div className={classes.accordionControl}>
					{showSelectAll && (
						<div
							className={classes.selectAllCheckbox}
							onClick={stopAccordionToggle}
							onMouseDown={stopAccordionToggle}
						>
							<Checkbox
								aria-label={`Select all ${group.label}`}
								checked={selectAllState === "checked"}
								indeterminate={
									selectAllState === "indeterminate"
								}
								onChange={() =>
									onToggleSelectAll(group.filterIndex)
								}
								{...selectAllCheckboxProps}
							/>
						</div>
					)}
					<Text
						className={classes.accordionControlLabel}
						{...labelTextProps}
					>
						{group.label}
					</Text>
				</div>
			</Accordion.Control>
			<Accordion.Panel>
				{group.type === "text" ? (
					<Stack {...stackProps}>
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
					</Stack>
				) : multiple ? (
					<Stack
						className={
							showSelectAll
								? classes.filterOptionChildren
								: undefined
						}
						{...stackProps}
					>
						{options}
					</Stack>
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
			</Accordion.Panel>
		</Accordion.Item>
	);
}
