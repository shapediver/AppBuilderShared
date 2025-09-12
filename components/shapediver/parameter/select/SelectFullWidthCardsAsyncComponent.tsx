import {ISelectComponentItemDataType} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Loader} from "@mantine/core";
import React, {useCallback, useMemo, useRef} from "react";
import useInfiniteScroll from "react-infinite-scroll-hook";
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
	const debounceRef = useRef<NodeJS.Timeout>();
	const handleLoadMore = useCallback(() => {
		return scrollingApi?.loadMore?.();
	}, [scrollingApi]);

	const debouncedOnSearch = useCallback(
		(searchTerms: string[]) => {
			clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(async () => {
				await scrollingApi?.setSearchTerms?.(searchTerms);
			}, 500);
		},
		[scrollingApi],
	);

	const [infiniteRef] = useInfiniteScroll({
		loading: !!scrollingApi?.loading,
		hasNextPage: !!scrollingApi?.hasNextPage,
		onLoadMore: handleLoadMore,
		disabled: !!scrollingApi?.error,
		rootMargin: "0px 0px 400px 0px",
	});

	const items = useMemo(
		() => scrollingApi?.items.map((item) => item.item) || [],
		[scrollingApi],
	);

	const itemsData = useMemo(
		() =>
			scrollingApi?.items.reduce(
				(acc, item) => {
					acc[item.item] = item.data || {};
					return acc;
				},
				{} as Record<string, ISelectComponentItemDataType>,
			),
		[scrollingApi],
	);

	return (
		<SelectFullWidthCardsComponent
			{...propsDefault}
			bottomSection={
				scrollingApi?.hasNextPage &&
				!scrollingApi?.loading && <Loader ref={infiniteRef} />
			}
			onSearch={(s) => debouncedOnSearch([s])}
			useLocalSearch={false} // Disable local search
			items={items}
			itemData={itemsData}
		/>
	);
}
