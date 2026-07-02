import {Anchor, Group, Loader} from "@mantine/core";
import {useCallback, useMemo, useState, type ReactNode} from "react";
import {resolveDisplayValueForCards} from "../../lib/select/selectComponentAsyncValue";
import {useSelectAsync} from "../../model/select/useSelectAsync";
import {SelectComponentProps} from "./SelectComponent";
import SelectFullWidthCardsComponent from "./SelectFullWidthCards";
import SelectGridComponent from "./SelectGridComponent";

const SEARCH_PREFIX = "search:";

type SelectComponentAsyncType = "grid" | "fullwidthcards";

interface SelectComponentAsyncProps extends SelectComponentProps {
	/** Type of select component to use. */
	type: SelectComponentAsyncType;
	/** Optional content rendered above search-term anchors in the top section. */
	prependTopSection?: ReactNode;
}

/**
 * Async wrapper component for SelectFullWidthCardsComponent that adds search and infinite scrolling capabilities.
 * This higher-order component handles filtering, search input, and lazy loading while delegating
 * the actual card rendering to the base SelectFullWidthCardsComponent.
 */
export default function SelectComponentAsync(props: SelectComponentAsyncProps) {
	const {
		type,
		scrollingApi,
		disabled,
		onChange,
		value,
		emitValue = "itemData",
		prependTopSection,
		...propsDefault
	} = props;

	const {
		debouncedOnSearch,
		items,
		itemsData,
		bottomSection,
		scrollRootRef,
		loading,
	} = useSelectAsync(scrollingApi);

	// Item key for `isSelected`; undefined when filtered out — parameter value unchanged.
	const displayValue = useMemo(
		() => resolveDisplayValueForCards(value, items, itemsData),
		[value, items, itemsData],
	);

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
			} else if (emitValue === "itemData" && v && itemsData?.[v].data) {
				// Card click passes item key `v`; commit JSON for String+database params.
				onChange(JSON.stringify(itemsData[v].data));
			} else {
				onChange(v);
			}
		},
		[onChange, itemsData, debouncedOnSearch, searchTerms, emitValue],
	);

	// show stack of search terms and allow to remove them
	const topSection = (
		<>
			{prependTopSection}
			{searchTerms.length > 0 && (
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
			)}
		</>
	);

	if (type === "fullwidthcards") {
		return (
			<SelectFullWidthCardsComponent
				{...propsDefault}
				value={displayValue}
				onChange={_onChange}
				bottomSection={
					loading && items.length === 0 ? <Loader /> : bottomSection
				}
				topSection={topSection}
				onSearch={(s) => debouncedOnSearch([...searchTerms, s])}
				items={items}
				itemData={itemsData}
				disabled={loading || disabled}
				multiselect={false}
				scrollRootRef={scrollRootRef}
			/>
		);
	} else if (type === "grid") {
		return (
			<SelectGridComponent
				{...propsDefault}
				value={displayValue}
				onChange={_onChange}
				bottomSection={
					loading && items.length === 0 ? <Loader /> : bottomSection
				}
				topSection={topSection}
				onSearch={(s) => debouncedOnSearch([...searchTerms, s])}
				items={items}
				itemData={itemsData}
				disabled={loading || disabled}
				multiselect={false}
				scrollRootRef={scrollRootRef}
			/>
		);
	} else return <></>;
}
