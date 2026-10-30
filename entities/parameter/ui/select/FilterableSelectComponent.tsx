import {
	IFilterableDatabaseSettings,
	SelectComponentType,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	DatabaseSelectFrame,
	type FilterableSelectComponentThemePropsType,
} from "./DatabaseSelectFrame";
import type {SelectComponentProps} from "./SelectComponent";
import SelectComponentAsync from "./SelectComponentAsync";
import SelectWidget from "./SelectWidget";

interface FilterableSelectComponentProps
	extends SelectComponentProps, FilterableSelectComponentThemePropsType {
	database: IFilterableDatabaseSettings;
	type?: SelectComponentType;
	/** Keeps filters, loaded pages, and search across unmount. `namespace:parameterId`. */
	persistenceKey?: string;
}

/**
 * Database-backed select.
 * Cards and grids stay paged. Every other display type renders the filtered catalog.
 */
export default function FilterableSelectComponent(
	props: FilterableSelectComponentProps,
) {
	const {
		type,
		database,
		itemData,
		limit,
		persistenceKey,
		items: _items,
		rootStackProps,
		loadingGroupProps,
		loaderProps,
		errorTextProps,
		filterSelectProps,
		filtersProps,
		activeFilterTagsProps,
		...selectProps
	} = props;

	const paged = type === "fullwidthcards" || type === "grid";

	return (
		<DatabaseSelectFrame
			database={database}
			itemData={itemData}
			limit={limit}
			persistenceKey={persistenceKey}
			resolveCatalog={!paged}
			rootStackProps={rootStackProps}
			loadingGroupProps={loadingGroupProps}
			loaderProps={loaderProps}
			errorTextProps={errorTextProps}
			filterSelectProps={filterSelectProps}
			filtersProps={filtersProps}
			activeFilterTagsProps={activeFilterTagsProps}
		>
			{({catalog, scrollingApi, listPersistence, viewVersion}) => {
				if (paged && scrollingApi) {
					return (
						<SelectComponentAsync
							// A new list (changed definition) starts with its own search.
							key={viewVersion}
							{...selectProps}
							type={type}
							scrollingApi={scrollingApi}
							persistence={listPersistence}
							multiselect={false}
						/>
					);
				}

				return (
					<SelectWidget
						{...selectProps}
						type={type}
						items={catalog?.items ?? []}
						itemData={catalog?.itemData}
						limit={limit}
						multiselect={false}
					/>
				);
			}}
		</DatabaseSelectFrame>
	);
}
