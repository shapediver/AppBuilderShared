import {useSelectAsync} from "@AppBuilderShared/hooks/shapediver/parameters/select/useSelectAsync";
import React, {useCallback} from "react";
import {SelectComponentProps} from "./SelectComponent";
import SelectGridComponent, {
	SelectGridComponentThemePropsType,
} from "./SelectGridComponent";

/**
 * Async wrapper component for SelectGridComponent that adds search and infinite scrolling capabilities.
 * This higher-order component handles filtering, search input, and lazy loading while delegating
 * the actual grid rendering to the base SelectGridComponent.
 */
export default function SelectGridAsyncComponent(
	props: SelectComponentProps & SelectGridComponentThemePropsType,
) {
	const {scrollingApi, onChange, ...propsDefault} = props;
	const {debouncedOnSearch, items, itemsData, bottomSection} =
		useSelectAsync(scrollingApi);

	const _onChange = useCallback(
		(v: string | null) => {
			if (v && itemsData?.[v].data)
				onChange(JSON.stringify(itemsData[v].data));
			else onChange(v);
		},
		[onChange, itemsData],
	);

	return (
		<SelectGridComponent
			{...propsDefault}
			onChange={_onChange}
			bottomSection={bottomSection}
			onSearch={(s) => debouncedOnSearch([s])}
			useLocalSearch={false} // Disable local search
			items={items}
			itemData={itemsData}
		/>
	);
}
