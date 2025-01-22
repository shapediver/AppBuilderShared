import { devtools } from "zustand/middleware";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { produce } from "immer";
import { SdPlatformModelQueryEmbeddableFields, SdPlatformModelQueryParameters, SdPlatformSortingOrder } from "@shapediver/sdk.platform-api-sdk-v1";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IPlatformPagedItemQueryProps } from "@AppBuilderShared/types/store/shapediverStorePlatformGeneric";
import { IShapeDiverStorePlatformModelExtended, TModelData, ModelCacheKeyEnum, TModelEmbed, TModelQueryPropsExt } from "@AppBuilderShared/types/store/shapediverStorePlatformModels";
import { devtoolsSettings } from "@AppBuilderShared/store/storeSettings";
import { useShapeDiverStorePlatform } from "@AppBuilderShared/store/useShapeDiverStorePlatform";

/**
 * Store for ShapeDiver Platform models.
 * @see {@link IShapeDiverStorePlatform}
 */
export const useShapeDiverStorePlatformModels = create<IShapeDiverStorePlatformModelExtended>()(devtools((set, get) => ({

	items: {},

	queryCache: {},

	addItem(data: TModelData) {

		const clientRef = useShapeDiverStorePlatform.getState().clientRef!;
		const pruneCache = get().pruneCache;
	
		const actions = {
			bookmark: async () => {
				await clientRef.client.bookmarks.create({model_id: data.id});
				set(produce(state => { state.items[data.id].data.bookmark = { bookmarked: true }; }), false, `bookmark ${data.id}`);
				pruneCache(ModelCacheKeyEnum.BookmarkedModels);
			},
			unbookmark: async () => {
				await clientRef.client.bookmarks.delete(data.id);
				set(produce(state => { state.items[data.id].data.bookmark = { bookmarked: false }; }), false, `unbookmark ${data.id}`);
				pruneCache(ModelCacheKeyEnum.BookmarkedModels);
			},
			confirmForOrganization: async () => {
				await clientRef.client.models.patch(data.id, { organization_settings: { confirmed: true } });
				set(produce(state => { state.items[data.id].data.organization_settings = { confirmed: true }; }), false, `confirmForOrganization ${data.id}`);
				pruneCache(ModelCacheKeyEnum.OrganizationConfirmedModels);
			},
			revokeForOrganization: async () => {
				await clientRef.client.models.patch(data.id, { organization_settings: { confirmed: false } });
				set(produce(state => { state.items[data.id].data.organization_settings = { confirmed: false }; }), false, `revokeForOrganization ${data.id}`);
				pruneCache(ModelCacheKeyEnum.OrganizationConfirmedModels);
			},
		};
		
		set(state => ({
			items: {
				...state.items,
				[data.id]: {
					data,
					actions
				}
			}
		}), false, `addItem ${data.id}`);
	},

	useQuery(params: IPlatformPagedItemQueryProps<TModelEmbed, TModelQueryPropsExt>) {
		const { clientRef, getUser } = useShapeDiverStorePlatform(useShallow(state => ({clientRef: state.clientRef, getUser: state.getUser})));
		const { addItem, queryCache } = get();
		
		const { queryParams, filterByUser, filterByOrganization, cacheKey } = params;

		// here we define default query parameters and overwrite them by the provided ones
		const queryParamsExt = useMemo(() => ({
			filters: { deleted_at: null, status: "done" },
			sorters: { created_at: SdPlatformSortingOrder.Desc },
			embed: [
				SdPlatformModelQueryEmbeddableFields.Bookmark,
				SdPlatformModelQueryEmbeddableFields.Decoration,
				SdPlatformModelQueryEmbeddableFields.Tags,
				SdPlatformModelQueryEmbeddableFields.User,
			],
			strict_limit: true,
			limit: 12,
			...queryParams,
		}), [queryParams]);
	
		// define keys for cache pruning
		const cacheKeys = useMemo(() => Array.isArray(cacheKey) ? cacheKey : cacheKey ? [cacheKey] : [], [cacheKey]);

		// define key for query cache
		const key = useMemo(() => `${JSON.stringify(cacheKeys)}-${JSON.stringify(queryParamsExt)}`, [cacheKeys, queryParamsExt]);

		// get data from cache, or create it and update cache
		const data = useMemo(() => queryCache[key] ?? { items: [], cacheKeys: cacheKeys }, [queryCache[key], cacheKeys]);
		useEffect(() => {
			if ( !queryCache[key] ) {
				set(state => ({ queryCache: { ...state.queryCache, [key]: data } }), false, `useQuery ${key}`);
			}
		}, [key, data, queryCache[key]]);
	
		const [ loading, setLoading ] = useState<boolean>(false);
		const [ error, setError ] = useState<Error | undefined>(undefined);

		const loadMore = useCallback(async () => {
			if (!clientRef)	return;

			const { queryCache } = get();

			const userFilter = filterByUser ? 
				{"user_id[=]": typeof filterByUser === "string" ? filterByUser : ((await getUser())?.id ?? "%")} 
				: undefined;
			const orgFilter = filterByOrganization ? 
				{"organization_id[=]": typeof filterByOrganization === "string" ? filterByOrganization : ((await getUser())?.organization?.id ?? "%")} 
				: undefined;
			
			const params: SdPlatformModelQueryParameters = {
				...queryParamsExt,
				offset: queryCache[key]?.pagination?.next_offset ?? undefined,
				filters: {
					...queryParamsExt.filters,
					...(userFilter ?? {}),
					...(orgFilter ?? {})
				}
			};
	
			setLoading(true);
			try {
				const { pagination, result: items } = (await clientRef.client.models.query(params)).data;
				items.forEach(item => addItem(item));
				set(produce(state => { 
					state.queryCache[key].items.push(...items.map(m => m.id)); 
					state.queryCache[key].pagination = pagination; 
				}), false, `loadMore ${key}`);
			}
			catch (error) {
				// TODO central error handling
				setError(error as Error);
			}
			finally {
				setLoading(false);
			}
		
		}, [clientRef, getUser, queryParamsExt, filterByUser, filterByOrganization, key]);
	
		return {
			loadMore, 
			loading,
			hasMore: !data.pagination || !!data.pagination.next_offset,
			items: data.items,
			error,
		};
	},

	pruneCache: (cacheType: ModelCacheKeyEnum) => {
		const key = cacheType;

		const { queryCache } = get();
		const _prunedCache = { ...queryCache };
		for (const _key in queryCache) {
			if (queryCache[_key].cacheKeys.includes(key)) {
				delete _prunedCache[_key];
			}	
		}
		
		if (Object.keys(_prunedCache).length !== Object.keys(queryCache).length)
			set(() => ({ queryCache: _prunedCache }), false, `pruneCache ${key}`);
	},

}), { ...devtoolsSettings, name: "ShapeDiver | Platform | Models" }));
