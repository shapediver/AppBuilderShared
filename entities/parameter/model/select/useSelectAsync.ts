import {ISelectComponentItemDataType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	IScrollingApi,
	IScrollingApiItemTypeSelect,
} from "@AppBuilderLib/features/ecommerce/config/scrollingapi";
import React, {useCallback, useMemo, useRef, useState} from "react";
import useInfiniteScroll from "react-infinite-scroll-hook";
import classes from "./useSelectAsync.module.css";

/**
 * Async select list state derived from a mutating {@link IScrollingApi}.
 * Depends on `resetState` / `searchRevision` because `scrollingApi.items` is updated in place.
 *
 * **Consumers:** {@link SelectComponentAsync} only (e-commerce `source` path and
 * filterable `database` path via {@link FilterableSelectComponent}).
 * Parameter value / selection persistence on filter changes is **not** handled here —
 * see `resolveDisplayValueForCards` in `lib/select/selectComponentAsyncValue.ts`.
 */
export const useSelectAsync = (
	scrollingApi?: IScrollingApi<IScrollingApiItemTypeSelect>,
) => {
	const debounceRef = useRef<ReturnType<typeof setTimeout>>();
	const loadingMoreRef = useRef(false);
	// Bumped after setSearchTerms so useMemo re-reads scrollingApi.items (API mutates in place).
	const [searchRevision, setSearchRevision] = useState(0);
	const [loadingMore, setLoadingMore] = useState(false);
	const handleLoadMore = useCallback(async () => {
		if (loadingMoreRef.current || !scrollingApi?.hasNextPage) {
			return;
		}

		loadingMoreRef.current = true;
		setLoadingMore(true);

		try {
			await scrollingApi?.loadMore?.();
		} finally {
			// Unlock after layout so a sentinel still in view does not chain pages.
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					loadingMoreRef.current = false;
					setLoadingMore(false);
				});
			});
		}
	}, [scrollingApi]);

	const debouncedOnSearch = useCallback(
		(searchTerms: string[], timeout: number = 500) => {
			clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(async () => {
				await scrollingApi?.setSearchTerms?.(searchTerms);
				setSearchRevision((revision) => revision + 1);
			}, timeout);
		},
		[scrollingApi],
	);

	const [infiniteRef, {rootRef}] = useInfiniteScroll({
		loading: !!scrollingApi?.loading || loadingMore,
		hasNextPage: !!scrollingApi?.hasNextPage,
		onLoadMore: handleLoadMore,
		disabled: !!scrollingApi?.error,
		// Small margin — 400px was for window scroll; inside a ~400px tall panel it
		// kept the sentinel always intersecting and fired loadMore in a burst.
		rootMargin: "0px 0px 48px 0px",
		delayInMs: 150,
	});

	// IScrollingApi updates items in place; resetState increments on filter/search/page changes.
	const scrollVersion = scrollingApi?.resetState;
	const items = useMemo(
		() => scrollingApi?.items.map((item) => item.item) || [],
		[scrollingApi, scrollVersion, searchRevision],
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
		[scrollingApi, scrollVersion, searchRevision],
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
	}, [scrollingApi, scrollVersion, infiniteRef]);

	return {
		debouncedOnSearch,
		items,
		itemsData,
		bottomSection,
		scrollRootRef: rootRef,
		loading: scrollingApi?.loading,
	};
};
