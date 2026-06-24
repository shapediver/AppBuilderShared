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
 */
export const useSelectAsync = (
	scrollingApi?: IScrollingApi<IScrollingApiItemTypeSelect>,
	/** Optional callback after search; parent syncs React state when API reference is stable. */
	onSyncScrollingApiState?: () => void,
) => {
	const debounceRef = useRef<ReturnType<typeof setTimeout>>();
	// Bumped after setSearchTerms so useMemo re-reads scrollingApi.items (API mutates in place).
	const [searchRevision, setSearchRevision] = useState(0);
	const handleLoadMore = useCallback(() => {
		return scrollingApi?.loadMore?.();
	}, [scrollingApi]);

	const debouncedOnSearch = useCallback(
		(searchTerms: string[], timeout: number = 500) => {
			clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(async () => {
				await scrollingApi?.setSearchTerms?.(searchTerms);
				setSearchRevision((revision) => revision + 1);
				// Parent may call setState to re-render when scrollingApi reference is unchanged.
				onSyncScrollingApiState?.();
			}, timeout);
		},
		[scrollingApi, onSyncScrollingApiState],
	);

	const [infiniteRef] = useInfiniteScroll({
		loading: !!scrollingApi?.loading,
		hasNextPage: !!scrollingApi?.hasNextPage,
		onLoadMore: handleLoadMore,
		disabled: !!scrollingApi?.error,
		rootMargin: "0px 0px 400px 0px",
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
		loading: scrollingApi?.loading,
	};
};
