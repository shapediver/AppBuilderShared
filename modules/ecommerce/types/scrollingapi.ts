import {z} from "zod";

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

/** Data for an item shown by a selection component. */
export interface IScrollingApiItemTypeSelectData {
	/** Display name to use instead of the item name. */
	displayname?: string;
	/** Tooltip. */
	tooltip?: string;
	/** Description. */
	description?: string;
	/** URL to image. Can be a data URL including a base 64 encoded image. */
	imageUrl?: string;
	/** Optional color, used for color selection components. */
	color?: string;
	/** Optionally hide the item. */
	hidden?: boolean;
	/**
	 * Optional additional data that can be sent to a String parameter
	 * represented by a selection component, instead of the selected item value.
	 */
	data?: Record<string, any>;
}

/** Item type for scrolling APIs of type "select". */
export interface IScrollingApiItemTypeSelect {
	/** The item identifier. */
	item: string;
	/** Optional additional item data. */
	data?: IScrollingApiItemTypeSelectData;
}

// Zod type definition for IScrollingApiItemTypeSelectData
export const IScrollingApiItemTypeSelectDataSchema = z.object({
	displayname: z.string().optional(),
	tooltip: z.string().optional(),
	description: z.string().optional(),
	imageUrl: z.string().optional(),
	color: z.string().optional(),
	hidden: z.boolean().optional(),
	data: z.record(z.any()).optional(),
});

// Zod type definition for IScrollingApiItemTypeSelect
export const IScrollingApiItemTypeSelectArraySchema = z.array(
	z.object({
		item: z.string(),
		data: IScrollingApiItemTypeSelectDataSchema.optional(),
	}),
);

export const validateScrollingApiItemTypeSelectArray = (value: any) => {
	return IScrollingApiItemTypeSelectArraySchema.safeParse(value);
};

/** Factory for scrolling APIs */
export interface IScrollingApiFactory {
	/**
	 * Get a scrolling API, using the given type and data source name.
	 * The peer uses type and source to determine what data to return.
	 */
	getApiSelect(source: string): IScrollingApi<IScrollingApiItemTypeSelect>;
}
