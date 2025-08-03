import {devtoolsSettings} from "@AppBuilderShared/store/storeSettings";
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
	SdPlatformRequestSavedStatePatch,
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
					const clientRef =
						useShapeDiverStorePlatform.getState().clientRef!;
					const {pruneCache} = get();

					const actions = {
						update: async (
							body: SdPlatformRequestSavedStatePatch,
						) => {
							const result =
								await clientRef!.client.savedStates.patch(
									data.id,
									body,
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
							await clientRef!.client.savedStates.delete(data.id);
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
					const {clientRef, getUser, currentModel} =
						useShapeDiverStorePlatform(
							useShallow((state) => ({
								clientRef: state.clientRef,
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
						if (!clientRef) return;

						const {queryCache} = get();

						// Note: We can't define the following filter criteria outside of loadMore,
						// because some of them require a promise to be resolved.
						const userFilter = filterByUser
							? {
									"owner_id[=]":
										typeof filterByUser === "string"
											? filterByUser
											: ((await getUser())?.id ?? "%"),
								}
							: undefined;
						const orgFilter = filterByOrganization
							? {
									"organization_id[=]":
										typeof filterByOrganization === "string"
											? filterByOrganization
											: ((await getUser())?.organization
													?.id ?? "%"),
								}
							: undefined;
						const modelFilter = filterByModel
							? {
									"model_id[=]":
										typeof filterByModel === "string"
											? filterByModel
											: (currentModel?.id ?? "%"),
								}
							: undefined;

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
						try {
							const {pagination, result: items} = (
								await clientRef.client.savedStates.query(params)
							).data;
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
						} finally {
							setLoading(false);
						}
					}, [
						clientRef,
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
