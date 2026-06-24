import type {FilterSelection} from "@AppBuilderLib/entities/parameter/lib/filterableDatabase/types";
import type {
	ActiveFilterTag,
	FilterTreeGroup,
} from "@AppBuilderLib/entities/parameter/model/filterableDatabase/useFilterableDatabase";
import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	Combobox,
	PillsInput,
	useCombobox,
	type ComboboxProps,
	type PillsInputFieldProps,
	type PillsInputProps,
} from "@mantine/core";
import {useCallback, useState, type MouseEvent} from "react";
import {
	FilterableDatabaseActiveFilterTags,
	FilterableDatabaseActiveFilterTagsStyleProps,
} from "./FilterableDatabaseActiveFilterTags";
import {
	FilterableDatabaseFilters,
	type FilterableDatabaseFiltersStyleProps,
} from "./FilterableDatabaseFilters";
import classes from "./FilterableDatabaseFilterSelect.module.css";

export interface FilterableDatabaseFilterSelectStyleProps {
	comboboxProps?: Omit<ComboboxProps, "store" | "children">;
	inputProps?: PillsInputProps;
	searchFieldProps?: PillsInputFieldProps;
	filtersProps?: FilterableDatabaseFiltersStyleProps;
	activeFilterTagsProps?: FilterableDatabaseActiveFilterTagsStyleProps;
}

export interface FilterableDatabaseFilterSelectProps extends FilterableDatabaseFilterSelectStyleProps {
	filterGroups: FilterTreeGroup[];
	selection: FilterSelection;
	filters: IFilterableDatabaseSettings["filters"];
	onToggle: (filterIndex: number, value: string) => void;
	onToggleSelectAll: (filterIndex: number) => void;
	onSetFilterText: (filterIndex: number, text: string) => void;
	tags: ActiveFilterTag[];
	onRemove: (filterIndex: number, value: string) => void;
	placeholder?: string;
}

export function FilterableDatabaseFilterSelect(
	props: FilterableDatabaseFilterSelectProps,
) {
	const {
		filterGroups,
		selection,
		filters,
		onToggle,
		onToggleSelectAll,
		onSetFilterText,
		tags,
		onRemove,
		placeholder = "Filters",
		comboboxProps,
		inputProps,
		searchFieldProps,
		filtersProps,
		activeFilterTagsProps,
	} = props;

	const [searchTerm, setSearchTerm] = useState("");

	const combobox = useCombobox({
		onDropdownClose: () => setSearchTerm(""),
	});

	const handlePillsInputClick = useCallback(
		(event: MouseEvent) => {
			if ((event.target as HTMLElement).closest("button")) {
				return;
			}
			if ((event.target as HTMLElement).closest("input")) {
				combobox.openDropdown();
				return;
			}
			combobox.toggleDropdown();
		},
		[combobox],
	);

	const handleDropdownMouseDown = useCallback((event: MouseEvent) => {
		event.preventDefault();
	}, []);

	return (
		<Combobox store={combobox} {...comboboxProps}>
			<Combobox.DropdownTarget>
				<PillsInput
					onClick={handlePillsInputClick}
					rightSection={<Combobox.Chevron />}
					{...inputProps}
				>
					{tags.length > 0 && (
						<FilterableDatabaseActiveFilterTags
							{...activeFilterTagsProps}
							tags={tags}
							onRemove={onRemove}
						/>
					)}
					<PillsInput.Field
						placeholder={placeholder}
						value={searchTerm}
						onChange={(event) =>
							setSearchTerm(event.currentTarget.value)
						}
						onFocus={() => combobox.openDropdown()}
						{...searchFieldProps}
					/>
				</PillsInput>
			</Combobox.DropdownTarget>

			<Combobox.Dropdown
				className={classes.dropdown}
				onMouseDown={handleDropdownMouseDown}
			>
				<FilterableDatabaseFilters
					{...filtersProps}
					filterGroups={filterGroups}
					selection={selection}
					filters={filters}
					searchTerm={searchTerm}
					onToggle={onToggle}
					onToggleSelectAll={onToggleSelectAll}
					onSetFilterText={onSetFilterText}
				/>
			</Combobox.Dropdown>
		</Combobox>
	);
}
