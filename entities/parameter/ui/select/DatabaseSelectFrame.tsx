import {
	IFilterableDatabaseSettings,
	ISelectComponentItemDataType,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
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
	type LoaderProps,
	type PillGroupProps,
	type PillProps,
	type PillsInputFieldProps,
	type PillsInputProps,
	type RadioProps,
	type StackProps,
	type TextInputProps,
	type TextProps,
} from "@mantine/core";
import {useMemo, type ReactNode} from "react";
import {resolveDatabaseCatalog} from "../../lib/filterableDatabase/resolveDatabaseCatalog";
import {
	useFilterableDatabase,
	type FilterableDatabaseListPersistence,
	type FilterableDatabaseScrollingApi,
} from "../../model/filterableDatabase/useFilterableDatabase";
import {FilterableDatabaseFilterSelect} from "../filterableDatabase/FilterableDatabaseFilterSelect";

const defaultStyleProps = {
	rootStackProps: {gap: "md" as const},
	loadingGroupProps: {justify: "center" as const, p: "md" as const},
	loaderProps: {},
	errorTextProps: {c: "red" as const, p: "md" as const},
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
		filterGroupSelectAllCheckboxProps: {},
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
	rootStackProps?: StackProps;
	loadingGroupProps?: GroupProps;
	loaderProps?: LoaderProps;
	errorTextProps?: Omit<TextProps, "children">;
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
		filterGroupSelectAllCheckboxProps?: CheckboxProps;
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

export interface DatabaseSelectCatalog {
	items: string[];
	itemData: Record<string, ISelectComponentItemDataType>;
}

/**
 * Loads a database catalog and shows filter controls when `filters` is non-empty.
 * Callers render the select widget for their display type.
 */
export function DatabaseSelectFrame(
	props: FilterableSelectComponentThemePropsType & {
		database: IFilterableDatabaseSettings;
		itemData?: Record<string, ISelectComponentItemDataType>;
		limit?: number;
		/** Keeps filters, loaded pages, and search across unmount. `namespace:parameterId`. */
		persistenceKey?: string;
		/**
		 * Build the full item list for widgets that render every row.
		 * Paged cards and grids read the scrolling API instead.
		 */
		resolveCatalog?: boolean;
		children: (state: {
			catalog: DatabaseSelectCatalog | undefined;
			scrollingApi: FilterableDatabaseScrollingApi | undefined;
			/** Saved search and scroll offset for the paged list. */
			listPersistence: FilterableDatabaseListPersistence | undefined;
			/** Changes when a new table or scrolling API replaces the shown one. */
			viewVersion: number;
		}) => ReactNode;
	},
) {
	const {
		rootStackProps,
		loadingGroupProps,
		loaderProps,
		errorTextProps,
		filterSelectProps,
		filtersProps,
		activeFilterTagsProps,
		database,
		itemData,
		limit,
		persistenceKey,
		resolveCatalog = true,
		children,
	} = useProps("FilterableSelectComponent", defaultStyleProps, props);

	const {
		loading,
		error,
		table,
		selection,
		toggleFilterValue,
		toggleSelectAll,
		setFilterText,
		removeFilterValue,
		activeFilterTags,
		filterGroups,
		scrollingApi,
		listPersistence,
		viewVersion,
	} = useFilterableDatabase(database, {
		pageSize: limit,
		itemData,
		// Paged widgets read the scrolling API; the others read the catalog.
		buildScrollingApi: !resolveCatalog,
		persistenceKey,
	});

	const catalog = useMemo(
		() =>
			resolveCatalog && table
				? resolveDatabaseCatalog(table, database, selection, itemData)
				: undefined,
		[resolveCatalog, table, database, selection, itemData],
	);

	if (loading) {
		return (
			<Group {...loadingGroupProps}>
				<Loader {...loaderProps} />
			</Group>
		);
	}

	if (error || (resolveCatalog && !catalog)) {
		return (
			<Text {...errorTextProps}>
				{error?.message ?? "Unable to load database"}
			</Text>
		);
	}

	const results = children({
		catalog,
		scrollingApi,
		listPersistence,
		viewVersion,
	});
	if (database.filters.length === 0) {
		return results;
	}

	return (
		<Stack {...rootStackProps}>
			<FilterableDatabaseFilterSelect
				{...filterSelectProps}
				filtersProps={filtersProps}
				activeFilterTagsProps={activeFilterTagsProps}
				filterGroups={filterGroups}
				selection={selection}
				filters={database.filters}
				onToggle={toggleFilterValue}
				onToggleSelectAll={toggleSelectAll}
				onSetFilterText={setFilterText}
				tags={activeFilterTags}
				onRemove={removeFilterValue}
			/>
			{results}
		</Stack>
	);
}
