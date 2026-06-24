import {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	Group,
	Loader,
	MantineThemeComponent,
	Stack,
	Text,
	useProps,
	type AccordionProps,
	type CheckboxProps,
	type ColorSwatchProps,
	type ComboboxProps,
	type GroupProps,
	type PillGroupProps,
	type PillProps,
	type PillsInputFieldProps,
	type PillsInputProps,
	type RadioProps,
	type StackProps,
	type TextInputProps,
	type TextProps,
} from "@mantine/core";
import {useFilterableDatabase} from "../../model/filterableDatabase/useFilterableDatabase";
import {FilterableDatabaseFilterSelect} from "../filterableDatabase/FilterableDatabaseFilterSelect";
import {SelectComponentProps} from "./SelectComponent";
import SelectComponentAsync from "./SelectComponentAsync";

const defaultStyleProps = {
	filterSelectProps: {
		comboboxProps: {},
		inputProps: {pointer: true},
		searchFieldProps: {},
	},
	filtersProps: {
		accordionProps: {variant: "separated" as const},
		stackProps: {gap: "md" as const},
		checkboxProps: {},
		radioProps: {},
		textInputProps: {},
		filterGroupStackProps: {gap: "sm" as const},
		filterGroupLabelTextProps: {fw: 500, size: "sm" as const},
		filterOptionGroupProps: {gap: "xs" as const, wrap: "nowrap" as const},
		filterOptionLabelTextProps: {size: "sm" as const},
		filterOptionColorSwatchProps: {size: 16},
	},
	activeFilterTagsProps: {
		pillGroupProps: {gap: "xs" as const},
		pillProps: {},
	},
};

export interface FilterableSelectComponentStyleProps {
	filterSelectProps?: {
		comboboxProps?: Omit<ComboboxProps, "store" | "children">;
		inputProps?: PillsInputProps;
		searchFieldProps?: PillsInputFieldProps;
	};
	filtersProps?: {
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
	};
	activeFilterTagsProps?: {
		pillGroupProps?: PillGroupProps;
		pillProps?: PillProps;
	};
}

export type FilterableSelectComponentThemePropsType =
	Partial<FilterableSelectComponentStyleProps>;

export function FilterableSelectComponentThemeProps(
	props: FilterableSelectComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

interface FilterableSelectComponentProps
	extends SelectComponentProps, FilterableSelectComponentThemePropsType {
	database: IFilterableDatabaseSettings;
	type: "fullwidthcards" | "grid";
}

export default function FilterableSelectComponent(
	props: FilterableSelectComponentProps,
) {
	const {filterSelectProps, filtersProps, activeFilterTagsProps, ...rest} =
		useProps("FilterableSelectComponent", defaultStyleProps, props);

	const {database, type, ...selectProps} = rest;

	const {
		loading,
		error,
		selection,
		toggleFilterValue,
		setFilterText,
		removeFilterValue,
		activeFilterTags,
		filterGroups,
		scrollingApi,
		syncScrollingApiState,
	} = useFilterableDatabase(database);

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
			<FilterableDatabaseFilterSelect
				{...filterSelectProps}
				filtersProps={filtersProps}
				activeFilterTagsProps={activeFilterTagsProps}
				filterGroups={filterGroups}
				selection={selection}
				filters={database.filters}
				onToggle={toggleFilterValue}
				onSetFilterText={setFilterText}
				tags={activeFilterTags}
				onRemove={removeFilterValue}
			/>
			{scrollingApi && (
				<SelectComponentAsync
					{...selectProps}
					type={type}
					scrollingApi={scrollingApi}
					onSyncScrollingApiState={syncScrollingApiState}
				/>
			)}
		</Stack>
	);
}
