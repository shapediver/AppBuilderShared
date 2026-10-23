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
			resolveCatalog={!paged}
			rootStackProps={rootStackProps}
			loadingGroupProps={loadingGroupProps}
			loaderProps={loaderProps}
			errorTextProps={errorTextProps}
			filterSelectProps={filterSelectProps}
			filtersProps={filtersProps}
			activeFilterTagsProps={activeFilterTagsProps}
		>
			{({catalog, scrollingApi}) => {
				if (paged && scrollingApi) {
					return (
						<SelectComponentAsync
							{...selectProps}
							type={type}
							scrollingApi={scrollingApi}
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
