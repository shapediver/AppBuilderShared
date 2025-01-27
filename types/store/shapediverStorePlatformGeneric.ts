import {
	SdPlatformQueryParameters,
	SdPlatformQueryResponse,
} from "@shapediver/sdk.platform-api-sdk-v1";

/**
 * Platform pagination data.
 * TODO replace by type exported from SDK
 */
export type SdPlatformQueryResponsePagination = Pick<
	SdPlatformQueryResponse<any>,
	"data"
>["data"]["pagination"];

/**
 * A generic platform item (a model, a user, an organization, a tag, etc).
 */
export interface IPlatformItem<TData, TActions> {
	/** The item's data. */
	data: TData;
	/** Actions that can be taken on the item. */
	actions: TActions;
}

/**
 * Interface common to all paged platform items independent of item type.
 */
export interface IPlatformPaging {
	/** Load more items. */
	loadMore: () => Promise<unknown>;
	/** Whether more items are available. */
	hasMore: boolean;
	/** Whether loading is currently going on. */
	loading: boolean;
	/** Potential error. */
	error?: Error;
}

/**
 * Generic interface for paged platform items, depending on item type.
 */
export interface IPlatformPagedItems<TQueryItem> extends IPlatformPaging {
	/**
	 * The items that have been fetched so far.
	 * We typically do not return the items directly, but rather their IDs.
	 * This means TQueryItem typically does not correspond to IPlatformItem<TData, TActions>.
	 */
	items: Array<TQueryItem>;
}

/**
 * Generic paged platform item query props.
 */
export type IPlatformPagedItemQueryProps<TEmbed, TQueryPropsExt> = {
	/** Parameters for the platform query. */
	queryParams: Pick<
		SdPlatformQueryParameters<TEmbed>,
		"embed" | "filters" | "sorters"
	>;
} & // additional custom query parameters
TQueryPropsExt & {
		/** The key(s) used for caching the query (used for cache pruning). */
		cacheKey?: string | Array<string>;
	};

/**
 * Generic store for platform items.
 */
export interface IShapeDiverStorePlatformGeneric<
	TData,
	TActions,
	TEmbed,
	TQueryItem,
	TQueryPropsExt,
> {
	/**
	 * The items in the store.
	 * These are the full items, as opposed to the IDs returned by the paged items.
	 */
	items: {[id: string]: IPlatformItem<TData, TActions>};

	/** Query items and add them to the store. */
	useQuery: (
		params: IPlatformPagedItemQueryProps<TEmbed, TQueryPropsExt>,
	) => IPlatformPagedItems<TQueryItem>;
}

/**
 * Cache for paged items.
 */
export interface IPlatformPagedItemsCache<TQueryItem, TCacheKey> {
	/**
	 * The items already fetched.
	 */
	items: Array<TQueryItem>;

	/** Pagination data. If unset, no data has been fetched yet. */
	pagination?: SdPlatformQueryResponsePagination;

	/** List of keys this cache depends on. */
	cacheKeys: Array<TCacheKey>;
}

/**
 * Extended generic store for platform items, including functionality used by the store implementation.
 */
export interface IShapeDiverStorePlatformGenericExtended<
	TData,
	TActions,
	TEmbed,
	TQueryItem,
	TQueryPropsExt,
	TCacheKey,
> extends IShapeDiverStorePlatformGeneric<
		TData,
		TActions,
		TEmbed,
		TQueryItem,
		TQueryPropsExt
	> {
	/** Add an item to the store. */
	addItem: (data: TData) => void;

	/** Query cache. */
	queryCache: {
		[key: string]: IPlatformPagedItemsCache<TQueryItem, TCacheKey>;
	};

	/** Prune cache. All cached queries depending on the key will be pruned. */
	pruneCache: (cacheKey: TCacheKey) => void;
}
