import {ISelectComponentItemDataType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	IScrollingApi,
	IScrollingApiItemTypeSelect,
} from "@AppBuilderLib/features/ecommerce/config/scrollingapi";
import React, {useCallback, useMemo, useRef} from "react";
import useInfiniteScroll from "react-infinite-scroll-hook";
import classes from "./useSelectAsync.module.css";

export const useSelectAsync = (
	scrollingApi?: IScrollingApi<IScrollingApiItemTypeSelect>,
) => {
	const debounceRef = useRef<NodeJS.Timeout>();
	const handleLoadMore = useCallback(() => {
		return scrollingApi?.loadMore?.();
	}, [scrollingApi]);

	const debouncedOnSearch = useCallback(
		(searchTerms: string[], timeout: number = 500) => {
			clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(async () => {
				await scrollingApi?.setSearchTerms?.(searchTerms);
			}, timeout);
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

	const bottomSection = useMemo(() => {
		return (
			scrollingApi?.hasNextPage &&
			!scrollingApi?.loading &&
			React.createElement("div", {
				ref: infiniteRef,
				className: classes.sentinel,
				"aria-hidden": true,
			})
		);
	}, [scrollingApi, infiniteRef]);

	return {
		debouncedOnSearch,
		items,
		itemsData,
		bottomSection,
		loading: scrollingApi?.loading,
	};
};
