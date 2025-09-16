import {ECommerceApiSingleton} from "@AppBuilderShared/modules/ecommerce/singleton";
import {
	IScrollingApi,
	IScrollingApiItemTypeSelect,
	validateScrollingApiItemTypeSelectArray,
} from "@AppBuilderShared/modules/ecommerce/types/scrollingapi";
import {isRunningInPlatform} from "@AppBuilderShared/utils/platform/environment";
import {produce} from "immer";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {devtoolsSettings} from "./storeSettings";

/**
 * A dummy scrolling API implementation for testing without the e-commerce API.
 */
interface IScrollingApiDummy<TItem> extends IScrollingApi<TItem> {
	_dummyItems: IScrollingApiItemTypeSelect[];
	_filteredDummyItems: IScrollingApiItemTypeSelect[];
	_pageSize: number;
	_counter: number;
}

/**
 * Store for scrolling APIs.
 */
interface IScrollingApiStore {
	scrollingApisSelect: {
		[source: string]: IScrollingApi<IScrollingApiItemTypeSelect>;
	};

	addScrollingApiSelect: (
		source: string,
	) => IScrollingApi<IScrollingApiItemTypeSelect>;
	removeScrollingApiSelect: (source: string) => void;
}

export const useScrollingApiStore = create<IScrollingApiStore>()(
	devtools(
		(set, get) => ({
			scrollingApisSelect: {},

			addScrollingApiSelect: (source) => {
				const {scrollingApisSelect} = get();
				if (scrollingApisSelect[source])
					return scrollingApisSelect[source];

				let newApi:
					| IScrollingApi<IScrollingApiItemTypeSelect>
					| undefined;

				// if window.parent === window return a dummy api for testing
				if (isRunningInPlatform() || window.parent === window) {
					const _dummyItems = Array.from({length: 95}, (_, i) => ({
						item: `Option ${String(i).padStart(3, "0")}`,
						data: {
							displayname: `Option ${String(i).padStart(3, "0")}`,
							tooltip: `This is option ${i}`,
						},
					}));
					const dummyApi: IScrollingApiDummy<IScrollingApiItemTypeSelect> =
						{
							loading: false,
							error: undefined,
							hasNextPage: true,
							items: [],
							_dummyItems,
							_filteredDummyItems: _dummyItems,
							_pageSize: 10,
							_counter: 0,
							loadMore: async () => {
								const api = get().scrollingApisSelect[
									source
								] as IScrollingApiDummy<IScrollingApiItemTypeSelect>;
								if (!api) return;
								if (
									api._counter >=
									api._filteredDummyItems.length
								)
									return;
								set(
									produce((state) => {
										state.scrollingApisSelect[
											source
										].loading = true;
									}),
								);
								return new Promise<unknown>((resolve) => {
									setTimeout(() => {
										const api = get().scrollingApisSelect[
											source
										] as IScrollingApiDummy<IScrollingApiItemTypeSelect>;
										const nextItems =
											api._filteredDummyItems.slice(
												api._counter,
												api._counter + api._pageSize,
											);
										set(
											produce(
												(state: IScrollingApiStore) => {
													const api = state
														.scrollingApisSelect[
														source
													] as IScrollingApiDummy<IScrollingApiItemTypeSelect>;
													api.loading = false;
													api.items =
														api.items.concat(
															nextItems,
														);
													api._counter +=
														api._pageSize;
													api.hasNextPage =
														api._counter <
														api._filteredDummyItems
															.length;
												},
											),
										);
										resolve(undefined);
									}, 250);
								});
							},
							setSearchTerms: async (terms: string[]) => {
								set(
									produce((state: IScrollingApiStore) => {
										const api = state.scrollingApisSelect[
											source
										] as IScrollingApiDummy<IScrollingApiItemTypeSelect>;
										api._filteredDummyItems =
											terms.length > 0
												? api._dummyItems.filter(
														(
															it: IScrollingApiItemTypeSelect,
														) =>
															it.item
																.toLowerCase()
																.includes(
																	terms[0].toLowerCase(),
																),
													)
												: api._dummyItems;
										api._counter = 0;
										api.items = [];
										api.loading = false;
										api.hasNextPage = true;
									}),
								);
							},
							setPageSize: async (pageSize: number) => {
								set(
									produce((state: IScrollingApiStore) => {
										const api = state.scrollingApisSelect[
											source
										] as IScrollingApiDummy<IScrollingApiItemTypeSelect>;
										api._pageSize = pageSize;
									}),
								);
							},
						};
					newApi = dummyApi;
				} else {
					newApi = {
						loading: false,
						error: undefined,
						hasNextPage: true,
						items: [],
						loadMore: async () => {
							set(
								produce((state) => {
									state.scrollingApisSelect[source].loading =
										true;
								}),
							);
							const api = await ECommerceApiSingleton;
							try {
								const result = await api.scrollingApiLoadMore({
									source,
								});
								const validation =
									validateScrollingApiItemTypeSelectArray(
										result.items,
									);
								if (!validation.success) throw validation.error;
								set(
									produce((state) => {
										const api = state.scrollingApisSelect[
											source
										] as IScrollingApi<IScrollingApiItemTypeSelect>;
										api.loading = false;
										if (result.hasNextPage !== undefined)
											api.hasNextPage =
												result.hasNextPage;
										if (result.items !== undefined)
											api.items = validation.data;
									}),
								);
							} catch (error) {
								set(
									produce((state) => {
										const api = state.scrollingApisSelect[
											source
										] as IScrollingApi<IScrollingApiItemTypeSelect>;
										api.loading = false;
										api.error = error as Error;
									}),
								);
							}
						},
						setSearchTerms: async (terms: string[]) => {
							set(
								produce((state) => {
									(
										state.scrollingApisSelect[
											source
										] as IScrollingApi<IScrollingApiItemTypeSelect>
									).loading = true;
								}),
							);
							const api = await ECommerceApiSingleton;
							try {
								const result =
									await api.scrollingApiSetParameters({
										source,
										terms,
									});
								const validation =
									validateScrollingApiItemTypeSelectArray(
										result.items,
									);
								if (!validation.success) throw validation.error;
								set(
									produce((state) => {
										const api = state.scrollingApisSelect[
											source
										] as IScrollingApi<IScrollingApiItemTypeSelect>;
										api.loading = false;
										if (result.hasNextPage !== undefined)
											api.hasNextPage =
												result.hasNextPage;
										if (result.items !== undefined)
											api.items = validation.data;
									}),
								);
							} catch (error) {
								set(
									produce((state) => {
										const api = state.scrollingApisSelect[
											source
										] as IScrollingApi<IScrollingApiItemTypeSelect>;
										api.loading = false;
										api.error = error as Error;
									}),
								);
							}
						},
						setPageSize: async (pageSize: number) => {
							set(
								produce((state) => {
									(
										state.scrollingApisSelect[
											source
										] as IScrollingApi<IScrollingApiItemTypeSelect>
									).loading = true;
								}),
							);
							const api = await ECommerceApiSingleton;
							try {
								const result =
									await api.scrollingApiSetParameters({
										source,
										pageSize,
									});
								const validation =
									validateScrollingApiItemTypeSelectArray(
										result.items,
									);
								if (!validation.success) throw validation.error;
								set(
									produce((state) => {
										const api = state.scrollingApisSelect[
											source
										] as IScrollingApi<IScrollingApiItemTypeSelect>;
										api.loading = false;
										if (result.hasNextPage !== undefined)
											api.hasNextPage =
												result.hasNextPage;
										if (result.items !== undefined)
											api.items = validation.data;
									}),
								);
							} catch (error) {
								set(
									produce((state) => {
										const api = state.scrollingApisSelect[
											source
										] as IScrollingApi<IScrollingApiItemTypeSelect>;
										api.loading = false;
										api.error = error as Error;
									}),
								);
							}
						},
					};
				}

				set(
					(state) => ({
						scrollingApisSelect: {
							...state.scrollingApisSelect,
							[source]: newApi,
						},
					}),
					false,
					`addScrollingApiSelect ${source}`,
				);

				return newApi;
			},

			removeScrollingApiSelect: (source) => {
				const {scrollingApisSelect} = get();
				if (!scrollingApisSelect[source]) return;
				set(
					(state) => {
						const newState = {...state.scrollingApisSelect};
						delete newState[source];
						return {scrollingApisSelect: newState};
					},
					false,
					`removeScrollingApiSelect ${source}`,
				);
			},
		}),
		{...devtoolsSettings, name: "ShapeDiver | ScrollingApi"},
	),
);
