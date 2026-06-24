import type {FilterSelection} from "@AppBuilderLib/entities/parameter/lib/filterableDatabase/types";
import type {FilterTreeGroup} from "@AppBuilderLib/entities/parameter/model/filterableDatabase/useFilterableDatabase";
import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	Accordion,
	Stack,
	type AccordionProps,
	type CheckboxProps,
	type ColorSwatchProps,
	type GroupProps,
	type RadioProps,
	type StackProps,
	type TextInputProps,
	type TextProps,
} from "@mantine/core";
import {FilterableDatabaseFilterGroup} from "./FilterableDatabaseFilterGroup";
import classes from "./FilterableDatabaseFilters.module.css";

export interface FilterableDatabaseFiltersStyleProps {
	accordionProps?: AccordionProps;
	stackProps?: StackProps;
	checkboxProps?: CheckboxProps;
	radioProps?: RadioProps;
	textInputProps?: TextInputProps;
	filterGroupStackProps?: StackProps;
	filterGroupLabelTextProps?: Omit<TextProps, "children">;
	filterOptionGroupProps?: Omit<GroupProps, "children">;
	filterOptionLabelTextProps?: Omit<TextProps, "children">;
	filterOptionColorSwatchProps?: Omit<ColorSwatchProps, "color">;
}

export interface FilterableDatabaseFiltersProps extends FilterableDatabaseFiltersStyleProps {
	filterGroups: FilterTreeGroup[];
	selection: FilterSelection;
	filters: IFilterableDatabaseSettings["filters"];
	searchTerm?: string;
	onToggle: (filterIndex: number, value: string) => void;
	onSetFilterText: (filterIndex: number, text: string) => void;
}

export function FilterableDatabaseFilters(
	props: FilterableDatabaseFiltersProps,
) {
	const {
		filterGroups,
		selection,
		filters,
		onToggle,
		onSetFilterText,
		searchTerm,
		accordionProps,
		stackProps,
		checkboxProps,
		radioProps,
		textInputProps,
		filterGroupStackProps,
		filterGroupLabelTextProps,
		filterOptionGroupProps,
		filterOptionLabelTextProps,
		filterOptionColorSwatchProps,
	} = props;

	const {
		variant,
		className,
		defaultValue,
		value: _value,
		onChange: _onChange,
		...restAccordionProps
	} = accordionProps ?? {};

	return (
		<Stack {...stackProps}>
			<Accordion
				className={[classes.accordion, className]
					.filter(Boolean)
					.join(" ")}
				variant={variant ?? "separated"}
				defaultValue={(defaultValue as string[] | undefined) ?? []}
				{...restAccordionProps}
				multiple
			>
				{filterGroups.map((group) => (
					<FilterableDatabaseFilterGroup
						key={group.filterIndex}
						group={group}
						selectedValues={selection[group.filterIndex] ?? []}
						multiple={filters[group.filterIndex]?.multiple ?? true}
						onToggle={onToggle}
						onSetFilterText={onSetFilterText}
						searchTerm={searchTerm}
						stackProps={filterGroupStackProps}
						checkboxProps={checkboxProps}
						radioProps={radioProps}
						textInputProps={textInputProps}
						labelTextProps={filterGroupLabelTextProps}
						optionGroupProps={filterOptionGroupProps}
						optionLabelTextProps={filterOptionLabelTextProps}
						optionColorSwatchProps={filterOptionColorSwatchProps}
					/>
				))}
			</Accordion>
		</Stack>
	);
}
