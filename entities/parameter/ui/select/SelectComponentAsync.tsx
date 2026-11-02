import {Anchor, Group, Loader} from "@mantine/core";
import {useCallback, useMemo, useState, type ReactNode} from "react";
import {
	emitSelectValue,
	resolveDisplayValueForCards,
} from "../../lib/select/selectComponentAsyncValue";
import type {FilterableDatabaseListPersistence} from "../../model/filterableDatabase/useFilterableDatabase";
import {useRestoredScrollTop} from "../../model/select/useRestoredScrollTop";
import {useSelectAsync} from "../../model/select/useSelectAsync";
import {SelectComponentProps} from "./SelectComponent";
import SelectFullWidthCardsComponent from "./SelectFullWidthCards";
import SelectGridComponent from "./SelectGridComponent";

const SEARCH_PREFIX = "search:";

type SelectComponentAsyncType = "grid" | "fullwidthcards";

interface SelectComponentAsyncProps extends Omit<
	SelectComponentProps,
	"items" | "itemData"
> {
	/** Type of select component to use. */
	type: SelectComponentAsyncType;
	/** Optional content rendered above search-term anchors in the top section. */
	prependTopSection?: ReactNode;
	/**
	 * Ignored. The visible rows come from `scrollingApi`.
	 * Accepted so existing callers can keep passing their static list.
	 */
	items?: SelectComponentProps["items"];
	/** Ignored. Item data comes from `scrollingApi`. */
	itemData?: SelectComponentProps["itemData"];
	/** Saves and restores search text, anchors, and scroll offset across unmount. */
	persistence?: FilterableDatabaseListPersistence;
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
		items: _items,
		itemData: _itemData,
		persistence,
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

	// stack of search terms, restored when the parameter control remounts
	const [restored] = useState(() => persistence?.read());
	const [searchTerms, setSearchTerms] = useState<string[]>(
		restored?.searchAnchors ?? [],
	);
	const [searchText, setSearchText] = useState(restored?.searchText ?? "");

	const publishSearch = useCallback(
		(anchors: string[], text: string) => {
			setSearchTerms(anchors);
			setSearchText(text);
			persistence?.save({searchText: text, searchAnchors: anchors});
		},
		[persistence],
	);

	const saveScrollTop = useCallback(
		(scrollTop: number) => persistence?.save({scrollTop}),
		[persistence],
	);
	const scrollRootRefWithRestore = useRestoredScrollTop(
		scrollRootRef,
		restored?.scrollTop ?? 0,
		saveScrollTop,
	);

	const _onChange = useCallback(
		(v: string | null) => {
			// if the value starts with SEARCH_PREFIX,
			// strip off the prefix and add the remaining value
			// to the stack of search terms
			if (v?.startsWith(SEARCH_PREFIX)) {
				const term = v.substring(SEARCH_PREFIX.length);
				const anchors = [...searchTerms, term];
				publishSearch(anchors, searchText);
				debouncedOnSearch([...searchTerms, term], 0);
			} else {
				onChange(emitSelectValue(v, emitValue, itemsData));
			}
		},
		[
			onChange,
			itemsData,
			debouncedOnSearch,
			searchTerms,
			searchText,
			emitValue,
			publishSearch,
		],
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
								publishSearch(terms, searchText);
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
				onSearch={(s) => {
					publishSearch(searchTerms, s);
					debouncedOnSearch([...searchTerms, s]);
				}}
				searchValue={searchText}
				items={items}
				itemData={itemsData}
				disabled={loading || disabled}
				multiselect={false}
				scrollRootRef={scrollRootRefWithRestore}
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
				onSearch={(s) => {
					publishSearch(searchTerms, s);
					debouncedOnSearch([...searchTerms, s]);
				}}
				searchValue={searchText}
				items={items}
				itemData={itemsData}
				disabled={loading || disabled}
				multiselect={false}
				scrollRootRef={scrollRootRefWithRestore}
			/>
		);
	} else return <></>;
}
