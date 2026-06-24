import type {FilterSelection} from "@AppBuilderLib/entities/parameter/lib/filterableDatabase/types";
import type {FilterTreeGroup} from "@AppBuilderLib/entities/parameter/model/filterableDatabase/useFilterableDatabase";
import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	Accordion,
	Stack,
	type AccordionProps,
	type CheckboxProps,
	type StackProps,
} from "@mantine/core";
import {FilterableDatabaseFilterGroup} from "./FilterableDatabaseFilterGroup";
import classes from "./FilterableDatabaseFilters.module.css";

export interface FilterableDatabaseFiltersStyleProps {
	accordionProps?: AccordionProps;
	stackProps?: StackProps;
	checkboxProps?: CheckboxProps;
	filterGroupStackProps?: StackProps;
}

export interface FilterableDatabaseFiltersProps extends FilterableDatabaseFiltersStyleProps {
	filterGroups: FilterTreeGroup[];
	selection: FilterSelection;
	filters: IFilterableDatabaseSettings["filters"];
	onToggle: (filterIndex: number, value: string) => void;
}

export function FilterableDatabaseFilters(
	props: FilterableDatabaseFiltersProps,
) {
	const {
		filterGroups,
		selection,
		filters,
		onToggle,
		accordionProps,
		stackProps,
		checkboxProps,
		filterGroupStackProps,
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
		<Stack gap="md" {...stackProps}>
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
						stackProps={filterGroupStackProps}
						checkboxProps={checkboxProps}
					/>
				))}
			</Accordion>
		</Stack>
	);
}
