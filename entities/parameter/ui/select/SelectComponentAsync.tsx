import {ISelectComponentItemDataType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {Anchor, Group, Loader} from "@mantine/core";
import {useCallback, useEffect, useMemo, useState, type ReactNode} from "react";
import {useSelectAsync} from "../../model/select/useSelectAsync";
import {SelectComponentProps} from "./SelectComponent";
import SelectFullWidthCardsComponent from "./SelectFullWidthCards";
import SelectGridComponent from "./SelectGridComponent";

const SEARCH_PREFIX = "search:";

function isValueInAvailableItems(
	value: string,
	items: string[],
	itemsData?: Record<string, ISelectComponentItemDataType>,
): boolean {
	if (items.includes(value)) {
		return true;
	}

	if (!itemsData) {
		return false;
	}

	return items.some((key) => {
		const data = itemsData[key]?.data;
		return data !== undefined && JSON.stringify(data) === value;
	});
}

function resolveItemKeyForValue(
	value: string,
	items: string[],
	itemsData?: Record<string, ISelectComponentItemDataType>,
): string {
	if (items.includes(value)) {
		return value;
	}

	if (!itemsData) {
		return value;
	}

	const match = items.find((key) => {
		const data = itemsData[key]?.data;
		return data !== undefined && JSON.stringify(data) === value;
	});

	return match ?? value;
}

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

	const {debouncedOnSearch, items, itemsData, bottomSection, loading} =
		useSelectAsync(scrollingApi);

	const displayValue = useMemo(
		() => (value ? resolveItemKeyForValue(value, items, itemsData) : value),
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
				onChange(JSON.stringify(itemsData[v].data));
			} else {
				onChange(v);
			}
		},
		[onChange, itemsData, debouncedOnSearch, searchTerms, emitValue],
	);

	// Clear selection only when the current value is absent from filtered items.
	useEffect(() => {
		if (!scrollingApi?.resetState || !value) {
			return;
		}
		if (isValueInAvailableItems(value, items, itemsData)) {
			return;
		}
		onChange(null);
	}, [scrollingApi?.resetState, value, items, itemsData, onChange]);

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
			/>
		);
	} else return <></>;
}
