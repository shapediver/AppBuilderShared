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
	type PillGroupProps,
	type PillProps,
	type StackProps,
} from "@mantine/core";
import {useFilterableDatabase} from "../../model/filterableDatabase/useFilterableDatabase";
import {FilterableDatabaseActiveFilterTags} from "../filterableDatabase/FilterableDatabaseActiveFilterTags";
import {FilterableDatabaseFilters} from "../filterableDatabase/FilterableDatabaseFilters";
import {SelectComponentProps} from "./SelectComponent";
import SelectComponentAsync from "./SelectComponentAsync";

const defaultStyleProps = {
	filtersProps: {
		accordionProps: {variant: "separated" as const},
		stackProps: {gap: "md" as const},
		checkboxProps: {},
		filterGroupStackProps: {gap: "sm" as const},
	},
	activeFilterTagsProps: {
		pillGroupProps: {gap: "xs" as const},
		pillProps: {},
	},
};

export interface FilterableSelectComponentStyleProps {
	filtersProps?: {
		accordionProps?: AccordionProps;
		stackProps?: StackProps;
		checkboxProps?: CheckboxProps;
		filterGroupStackProps?: StackProps;
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
	const {filtersProps, activeFilterTagsProps, ...rest} = useProps(
		"FilterableSelectComponent",
		defaultStyleProps,
		props,
	);

	const {database, type, ...selectProps} = rest;

	const {
		loading,
		error,
		selection,
		toggleFilterValue,
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
			<FilterableDatabaseFilters
				{...filtersProps}
				filterGroups={filterGroups}
				selection={selection}
				filters={database.filters}
				onToggle={toggleFilterValue}
			/>
			{scrollingApi && (
				<SelectComponentAsync
					{...selectProps}
					type={type}
					scrollingApi={scrollingApi}
					onSyncScrollingApiState={syncScrollingApiState}
					prependTopSection={
						<FilterableDatabaseActiveFilterTags
							{...activeFilterTagsProps}
							tags={activeFilterTags}
							onRemove={removeFilterValue}
						/>
					}
				/>
			)}
		</Stack>
	);
}
