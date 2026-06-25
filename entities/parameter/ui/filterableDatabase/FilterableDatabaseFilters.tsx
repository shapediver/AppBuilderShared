import {buildFilterRenderSegments} from "@AppBuilderLib/entities/parameter/lib/filterableDatabase/buildFilterRenderSegments";
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
import {useMemo} from "react";
import {
	FilterableDatabaseFilterGroup,
	FilterableDatabaseInlineFilter,
} from "./FilterableDatabaseFilterGroup";
import classes from "./FilterableDatabaseFilters.module.css";

export interface FilterableDatabaseFiltersStyleProps {
	accordionProps?: AccordionProps;
	stackProps?: StackProps;
	checkboxProps?: CheckboxProps;
	radioProps?: RadioProps;
	textInputProps?: TextInputProps;
	filterGroupStackProps?: StackProps;
	filterGroupLabelTextProps?: Omit<TextProps, "children">;
	filterGroupSelectAllCheckboxProps?: CheckboxProps;
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
	onToggleSelectAll: (filterIndex: number) => void;
	onSetFilterText: (filterIndex: number, text: string) => void;
}

function renderFilterGroup(
	group: FilterTreeGroup,
	props: FilterableDatabaseFiltersProps,
) {
	const {
		selection,
		filters,
		searchTerm,
		onToggle,
		onToggleSelectAll,
		onSetFilterText,
		filterGroupStackProps,
		checkboxProps,
		radioProps,
		textInputProps,
		filterGroupLabelTextProps,
		filterGroupSelectAllCheckboxProps,
		filterOptionGroupProps,
		filterOptionLabelTextProps,
		filterOptionColorSwatchProps,
	} = props;

	return {
		group,
		selectedValues: selection[group.filterIndex] ?? [],
		multiple: filters[group.filterIndex]?.multiple ?? true,
		onToggle,
		onToggleSelectAll,
		onSetFilterText,
		searchTerm,
		stackProps: filterGroupStackProps,
		checkboxProps,
		selectAllCheckboxProps: filterGroupSelectAllCheckboxProps,
		radioProps,
		textInputProps,
		labelTextProps: filterGroupLabelTextProps,
		optionGroupProps: filterOptionGroupProps,
		optionLabelTextProps: filterOptionLabelTextProps,
		optionColorSwatchProps: filterOptionColorSwatchProps,
	};
}

export function FilterableDatabaseFilters(
	props: FilterableDatabaseFiltersProps,
) {
	const {filterGroups, filters, accordionProps, stackProps} = props;

	const segments = useMemo(
		() => buildFilterRenderSegments(filterGroups, filters),
		[filterGroups, filters],
	);

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
			{segments.map((segment) => {
				if (segment.kind === "inline") {
					return (
						<FilterableDatabaseInlineFilter
							key={segment.group.filterIndex}
							{...renderFilterGroup(segment.group, props)}
						/>
					);
				}

				return (
					<Accordion
						key={segment.groups
							.map((group) => group.filterIndex)
							.join("-")}
						className={[classes.accordion, className]
							.filter(Boolean)
							.join(" ")}
						variant={variant ?? "separated"}
						defaultValue={
							(defaultValue as string[] | undefined) ?? []
						}
						{...restAccordionProps}
						multiple
					>
						{segment.groups.map((group) => (
							<FilterableDatabaseFilterGroup
								key={group.filterIndex}
								{...renderFilterGroup(group, props)}
							/>
						))}
					</Accordion>
				);
			})}
		</Stack>
	);
}
