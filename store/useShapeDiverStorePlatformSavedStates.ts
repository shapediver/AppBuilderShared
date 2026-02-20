import {devtoolsSettings} from "@AppBuilderLib/shared/config/storeSettings";
import {defineFilter} from "@AppBuilderLib/shared/lib/platform";
import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
import {IPlatformPagedItemQueryProps} from "@AppBuilderShared/types/store/shapediverStorePlatformGeneric";
import {
	IShapeDiverStorePlatformSavedStateExtended,
	SavedStateCacheKeyEnum,
	TSavedStateData,
	TSavedStateEmbed,
	TSavedStateQueryPropsExt,
} from "@AppBuilderShared/types/store/shapediverStorePlatformSavedStates";
import {
	SdPlatformQueryResponse,
	SdPlatformRequestSavedStatePatch,
	SdPlatformResponseSavedStatePublic,
	SdPlatformSavedStateApiQueryParameters,
	SdPlatformSavedStateQueryEmbeddableFields,
	SdPlatformSortingOrder,
} from "@shapediver/sdk.platform-api-sdk-v1";
import {produce} from "immer";
import {useCallback, useEffect, useMemo, useState} from "react";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {useShallow} from "zustand/react/shallow";

/**
 * Store for ShapeDiver Platform saved states.
 * @see {@link IShapeDiverStorePlatformSavedState}
 */
export const useShapeDiverStorePlatformSavedStates =
	create<IShapeDiverStorePlatformSavedStateExtended>()(
		devtools(
			(set, get) => ({
				items: {},

				queryCache: {},

				addItem(data: TSavedStateData) {
					const {authWrapper} = useShapeDiverStorePlatform.getState();
					const {pruneCache} = get();

					const actions = {
						update: async (
							body: SdPlatformRequestSavedStatePatch,
						) => {
							const result = await authWrapper((c) =>
								c.client.savedStates.patch(data.id, body),
							);
							set(
								produce((state) => {
									state.items[data.id].data = result.data;
								}),
								false,
								`update ${data.id}`,
							);
							// depending on the updated properties, further query caches might need to be pruned
							if ("visibility" in body) {
								pruneCache(
									SavedStateCacheKeyEnum.OrganizationSavedStates,
								);
								pruneCache(
									SavedStateCacheKeyEnum.PublicSavedStates,
								);
							}
						},
						delete: async () => {
							await authWrapper((c) => {
								return c.client.savedStates.delete(data.id);
							});
							set(
								produce((state) => {
									delete state.items[data.id];
								}),
								false,
								`delete ${data.id}`,
							);
							pruneCache(SavedStateCacheKeyEnum.AllSavedStates);
						},
					};

					set(
						(state) => ({
							items: {
								...state.items,
								[data.id]: {
									data,
									actions,
								},
							},
						}),
						false,
						`addItem ${data.id}`,
					);
				},

				useQuery(
					params: IPlatformPagedItemQueryProps<
						TSavedStateEmbed,
						TSavedStateQueryPropsExt
					>,
				) {
					const {authWrapper, getUser, currentModel} =
						useShapeDiverStorePlatform(
							useShallow((state) => ({
								authWrapper: state.authWrapper,
								getUser: state.getUser,
								currentModel: state.currentModel,
							})),
						);
					const {addItem, queryCache} = get();

					const {
						queryParams,
						filterByUser,
						filterByOrganization,
						filterByModel,
						cacheKey,
					} = params;

					// here we define default query parameters and overwrite them by the provided ones
					const queryParamsExt = useMemo(
						() => ({
							filters: {},
							sorters: {created_at: SdPlatformSortingOrder.Desc},
							embed: [
								SdPlatformSavedStateQueryEmbeddableFields.Image,
								SdPlatformSavedStateQueryEmbeddableFields.Owner,
							],
							strict_limit: true,
							limit: 3,
							...queryParams,
						}),
						[queryParams],
					);

					// define keys for cache pruning
					const cacheKeys = useMemo(
						() =>
							Array.isArray(cacheKey)
								? cacheKey
								: cacheKey
									? [cacheKey]
									: [],
						[cacheKey],
					);

					// define key for query cache
					const key = useMemo(
						() =>
							`${JSON.stringify(cacheKeys)}-${JSON.stringify(queryParamsExt)}-${filterByUser}-${filterByOrganization}-${filterByModel}`,
						[
							cacheKeys,
							queryParamsExt,
							filterByUser,
							filterByOrganization,
							filterByModel,
						],
					);

					// get data from cache, or create it and update cache
					const data = useMemo(
						() =>
							queryCache[key] ?? {
								items: [],
								cacheKeys: cacheKeys,
							},
						[queryCache[key], cacheKeys],
					);
					useEffect(() => {
						if (!queryCache[key]) {
							set(
								(state) => ({
									queryCache: {
										...state.queryCache,
										[key]: data,
									},
								}),
								false,
								`useQuery ${key}`,
							);
						}
					}, [key, data, queryCache[key]]);

					const [loading, setLoading] = useState<boolean>(false);
					const [error, setError] = useState<Error | undefined>(
						undefined,
					);

					const loadMore = useCallback(async () => {
						const {queryCache} = get();

						// Note: We can't define the following filter criteria outside of loadMore,
						// because some of them require a promise to be resolved.
						const userFilter = defineFilter(
							"owner_id[=]",
							filterByUser,
							(await getUser())?.id ?? "%",
						);
						const orgFilter = defineFilter(
							"organization_id[=]",
							filterByOrganization,
							(await getUser())?.organization?.id ?? "%",
						);
						const modelFilter = defineFilter(
							"model_id[=]",
							filterByModel,
							currentModel?.id ?? "%",
						);

						const params: SdPlatformSavedStateApiQueryParameters = {
							...queryParamsExt,
							offset:
								queryCache[key]?.pagination?.next_offset ??
								undefined,
							filters: {
								...queryParamsExt.filters,
								...(userFilter ?? {}),
								...(orgFilter ?? {}),
								...(modelFilter ?? {}),
							},
						};

						setLoading(true);
						let response:
							| SdPlatformQueryResponse<SdPlatformResponseSavedStatePublic>
							| Error;
						try {
							response = await authWrapper((c) =>
								c.client.savedStates.query(params),
							);
							const {pagination, result: items} = response.data;
							items.forEach((item) => addItem(item));
							set(
								produce((state) => {
									state.queryCache[key].items.push(
										...items.map((m) => m.id),
									);
									state.queryCache[key].pagination =
										pagination;
								}),
								false,
								`loadMore ${key}`,
							);
						} catch (error) {
							// TODO central error handling
							setError(error as Error);
							response = error as Error;
						} finally {
							setLoading(false);
						}

						return response;
					}, [
						authWrapper,
						getUser,
						queryParamsExt,
						filterByUser,
						filterByOrganization,
						filterByModel,
						currentModel,
						key,
					]);

					return {
						loadMore,
						loading,
						hasMore:
							!data.pagination || !!data.pagination.next_offset,
						items: data.items,
						error,
					};
				},

				pruneCache: (cacheType: SavedStateCacheKeyEnum) => {
					const key = cacheType;

					const {queryCache} = get();
					const _prunedCache = {...queryCache};
					for (const _key in queryCache) {
						if (queryCache[_key].cacheKeys.includes(key)) {
							delete _prunedCache[_key];
						}
					}

					if (
						Object.keys(_prunedCache).length !==
						Object.keys(queryCache).length
					)
						set(
							() => ({queryCache: _prunedCache}),
							false,
							`pruneCache ${key}`,
						);
				},
			}),
			{...devtoolsSettings, name: "ShapeDiver | Platform | Saved States"},
		),
	);
