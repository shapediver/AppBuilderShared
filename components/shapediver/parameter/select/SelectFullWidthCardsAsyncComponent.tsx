import {useSelectAsync} from "@AppBuilderShared/hooks/shapediver/parameters/select/useSelectAsync";
import React from "react";
import {SelectComponentProps} from "./SelectComponent";
import SelectFullWidthCardsComponent, {
	SelectFullWidthCardsComponentThemePropsType,
} from "./SelectFullWidthCards";

/**
 * Async wrapper component for SelectFullWidthCardsComponent that adds search and infinite scrolling capabilities.
 * This higher-order component handles filtering, search input, and lazy loading while delegating
 * the actual card rendering to the base SelectFullWidthCardsComponent.
 */
export default function SelectFullWidthCardsAsyncComponent(
	props: SelectComponentProps & SelectFullWidthCardsComponentThemePropsType,
) {
	const {scrollingApi, ...propsDefault} = props;
	const {debouncedOnSearch, items, itemsData, bottomSection} =
		useSelectAsync(scrollingApi);

	return (
		<SelectFullWidthCardsComponent
			{...propsDefault}
			bottomSection={bottomSection}
			onSearch={(s) => debouncedOnSearch([s])}
			useLocalSearch={false} // Disable local search
			items={items}
			itemData={itemsData}
		/>
	);
}
