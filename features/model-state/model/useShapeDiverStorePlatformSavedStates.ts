import {
	IShapeDiverStorePlatformSavedStateExtended,
	SavedStateCacheKeyEnum,
	TSavedStateData,
	TSavedStateEmbed,
	TSavedStateQueryPropsExt,
} from "@AppBuilderLib/features/model-state/config/shapediverStorePlatformSavedStates";
import {IPlatformPagedItemQueryProps} from "@AppBuilderLib/shared/config/shapediverStorePlatformGeneric";
import {devtoolsSettings} from "@AppBuilderLib/shared/config/storeSettings";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {shouldUsePlatform} from "@AppBuilderLib/shared/lib/platform/environment";
import {defineFilter} from "@AppBuilderLib/shared/lib/platform/filter";
import {useShapeDiverStorePlatform} from "@AppBuilderLib/shared/model/useShapeDiverStorePlatform";
import {
	SdPlatformRequestSavedStatePatch,
	SdPlatformSavedStateApiQueryParameters,
	SdPlatformSavedStateQueryEmbeddableFields,
	SdPlatformSortingOrder,
} from "@shapediver/sdk.platform-api-sdk-v1";
import {produce} from "immer";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
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
							const result = await authWrapper(async (c) => {
								if (!c) {
									Logger.warn(
										`Updating saved state ${data.id} skipped because platform client is not available.`,
									);
									return;
								}

								return c.client.savedStates.patch(
									data.id,
									body,
								);
							});

							if (!result) return;

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
							const result = await authWrapper(async (c) => {
								if (!c) {
									Logger.warn(
										`Deleting saved state ${data.id} skipped because platform client is not available.`,
									);
									return;
								}

								return c.client.savedStates.delete(data.id);
							});

							if (!result) return;

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
					const loadInFlightRef = useRef(false);

					const loadMore = useCallback(async () => {
						// Prevent parallel first-page fetches (effect / Strict Mode /
						// infinite scroll) from duplicating ids.
						if (loadInFlightRef.current) return;
						loadInFlightRef.current = true;
						setLoading(true);

						try {
							// Note: We can't define the following filter criteria outside of loadMore,
							// because some of them require a promise to be resolved.
							// Skip getUser() when neither user nor organization filter is needed:
							// getUser() authenticates with redirect=true by default, which would
							// override a `redirect=0` URL parameter and trigger a login redirect.
							const needsUser =
								filterByUser !== undefined ||
								filterByOrganization !== undefined;
							const user = needsUser
								? await getUser()
								: undefined;
							const userFilter = defineFilter(
								"owner_id[=]",
								filterByUser,
								user?.id ?? "%",
							);
							const orgFilter = defineFilter(
								"organization_id[=]",
								filterByOrganization,
								user?.organization?.id ?? "%",
							);
							const modelFilter = defineFilter(
								"model_id[=]",
								filterByModel,
								currentModel?.id ?? "%",
							);

							const {queryCache: cache} = get();
							const params: SdPlatformSavedStateApiQueryParameters =
								{
									...queryParamsExt,
									offset:
										cache[key]?.pagination?.next_offset ??
										undefined,
									filters: {
										...queryParamsExt.filters,
										...(userFilter ?? {}),
										...(orgFilter ?? {}),
										...(modelFilter ?? {}),
									},
								};

							// Off-platform: no SDK client — use items from iframe embedding.
							if (!shouldUsePlatform()) {
								const modelIdFilter =
									filterByModel === true
										? currentModel?.id
										: typeof filterByModel === "string"
											? filterByModel
											: undefined;
								const ids = Object.values(get().items)
									.map((item) => item.data)
									.filter((data) =>
										filterByModel === undefined
											? true
											: !!modelIdFilter &&
												data.model_id === modelIdFilter,
									)
									.map((data) => data.id);
								set(
									produce((state) => {
										if (!state.queryCache[key]) {
											state.queryCache[key] = {
												items: [],
												cacheKeys,
											};
										}
										state.queryCache[key].items = ids;
										state.queryCache[key].pagination = {
											next_offset: undefined,
										};
									}),
									false,
									`loadMore cached ${key}`,
								);
								return;
							}

							// Public listing must work without login (redirect=false).
							const response = await authWrapper(async (c) => {
								return c.client.savedStates.query(params);
							}, false);
							if (!response) return;

							const {pagination, result: items} = response.data;
							items.forEach((item) => addItem(item));
							set(
								produce((state) => {
									const existing =
										state.queryCache[key].items;
									const newIds = items
										.map((m) => m.id)
										.filter((id) => !existing.includes(id));
									existing.push(...newIds);
									state.queryCache[key].pagination =
										pagination;
								}),
								false,
								`loadMore ${key}`,
							);
							return response;
						} catch (error) {
							// TODO central error handling
							setError(error as Error);
							return error as Error;
						} finally {
							loadInFlightRef.current = false;
							setLoading(false);
						}
					}, [
						authWrapper,
						getUser,
						queryParamsExt,
						filterByUser,
						filterByOrganization,
						filterByModel,
						currentModel,
						key,
						cacheKeys,
						addItem,
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
