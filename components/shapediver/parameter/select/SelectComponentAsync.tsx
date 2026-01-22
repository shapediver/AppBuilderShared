import {useSelectAsync} from "@AppBuilderShared/hooks/shapediver/parameters/select/useSelectAsync";
import {Anchor, Group, Loader} from "@mantine/core";
import React, {useCallback, useEffect, useState} from "react";
import {SelectComponentProps} from "./SelectComponent";
import SelectFullWidthCardsComponent from "./SelectFullWidthCards";
import SelectGridComponent from "./SelectGridComponent";

const SEARCH_PREFIX = "search:";

type SelectComponentAsyncType = "grid" | "fullwidthcards";

interface SelectComponentAsyncProps extends SelectComponentProps {
	/** Type of select component to use. */
	type: SelectComponentAsyncType;
}

/**
 * Async wrapper component for SelectFullWidthCardsComponent that adds search and infinite scrolling capabilities.
 * This higher-order component handles filtering, search input, and lazy loading while delegating
 * the actual card rendering to the base SelectFullWidthCardsComponent.
 */
export default function SelectComponentAsync(props: SelectComponentAsyncProps) {
	const {type, scrollingApi, onChange, ...propsDefault} = props;
	const {debouncedOnSearch, items, itemsData, bottomSection, loading} =
		useSelectAsync(scrollingApi);

	// stack of search terms
	const [searchTerms, setSearchTerms] = useState<string[]>([]);

	const _onChange = useCallback(
		(v: string | null) => {
			// if the value starts with SEARCH_PREFIX,
			// strip off the prefix and add the remaining value
			// to the stack of search terms
			if (v?.startsWith(SEARCH_PREFIX)) {
				const term = v.substring(SEARCH_PREFIX.length);
				setSearchTerms((prev) => [...prev, term]);
				debouncedOnSearch([...searchTerms, term], 0);
			} else if (v && itemsData?.[v].data)
				onChange(JSON.stringify(itemsData[v].data));
			else onChange(v);
		},
		[onChange, itemsData, debouncedOnSearch, searchTerms],
	);

	// in case no items are available, reset the value
	useEffect(() => {
		if (items.length === 0) {
			onChange(null);
			setSearchTerms([]);
		}
	}, [onChange, items]);

	// show stack of search terms and allow to remove them
	const topSection = (
		<Group>
			{searchTerms.map((term, index) => (
				<Anchor
					key={index}
					onClick={() => {
						const terms = searchTerms.slice(0, index);
						setSearchTerms(terms);
						debouncedOnSearch(terms, 0);
					}}
				>
					{term}
				</Anchor>
			))}
		</Group>
	);

	if (type === "fullwidthcards") {
		return (
			<SelectFullWidthCardsComponent
				{...propsDefault}
				onChange={_onChange}
				bottomSection={
					loading && items.length === 0 ? <Loader /> : bottomSection
				}
				topSection={topSection}
				onSearch={(s) => debouncedOnSearch([...searchTerms, s])}
				items={items}
				itemData={itemsData}
				disabled={loading}
				multiselect={false}
			/>
		);
	} else if (type === "grid") {
		return (
			<SelectGridComponent
				{...propsDefault}
				onChange={_onChange}
				bottomSection={
					loading && items.length === 0 ? <Loader /> : bottomSection
				}
				topSection={topSection}
				onSearch={(s) => debouncedOnSearch([...searchTerms, s])}
				items={items}
				itemData={itemsData}
				disabled={loading}
				multiselect={false}
			/>
		);
	} else return <></>;
}
