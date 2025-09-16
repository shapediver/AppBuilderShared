import {ISelectComponentItemDataType} from "@AppBuilderShared/types/shapediver/appbuilder";

/**
 * Generic interface for infinite scrolling API results.
 * Some of these properties can be used with the useInfiniteScroll hook.
 * https://www.npmjs.com/package/react-infinite-scroll-hook
 */
export interface IScrollingApi<TItem> {
	/** Whether loading is currently going on. */
	loading: boolean;
	/** Potential loading error. */
	error: Error | undefined;
	/** Whether calling loadMore might result in further items. */
	hasNextPage: boolean;
	/** Function to be called to continue loading. */
	loadMore: () => Promise<unknown>;
	/**
	 * Set a search term to use.
	 * This is independent of useInfiniteScroll.
	 */
	setSearchTerms: (terms: string[]) => Promise<unknown>;
	/**
	 * Set a preferred page size.
	 * Note: The page size will not necessarily be attained in all cases.
	 * This is independent of useInfiniteScroll.
	 */
	setPageSize: (size: number) => Promise<unknown>;
	/**
	 * The currently loaded items.
	 */
	items: TItem[];
}

/** Item type for scrolling APIs of type "select". */
export interface IScrollingApiItemTypeSelect {
	/** The item identifier. */
	item: string;
	/** Optional additional item data. */
	data?: ISelectComponentItemDataType;
}

/** Factory for scrolling APIs */
export interface IScrollingApiFactory {
	/**
	 * Get a scrolling API, using the given type and data source name.
	 * The peer uses type and source to determine what data to return.
	 */
	getApiSelect(source: string): IScrollingApi<IScrollingApiItemTypeSelect>;
}
