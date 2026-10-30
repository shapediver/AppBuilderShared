import type {
	IFilterableDatabaseSettings,
	ISelectComponentItemDataType,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
	buildActiveFilterTags,
	type ActiveFilterTag,
} from "../../lib/filterableDatabase/buildActiveFilterTags";
import {createFilterableDatabaseScrollingApi} from "../../lib/filterableDatabase/createScrollingApi";
import {
	applySelectAll,
	extractFilterOptions,
	getSelectAllState,
	toggleFilterSelection,
} from "../../lib/filterableDatabase/filterLogic";
import {
	fetchRawText,
	hasDataSource,
} from "../../lib/filterableDatabase/resolveDataSource";
import {resolveFilterableDatabaseEngine} from "../../lib/filterableDatabase/resolveEngine";
import type {
	DatabaseTable,
	FilterSelection,
} from "../../lib/filterableDatabase/types";
import {
	filterableDatabaseSettingsKey,
	readFilterableDatabaseTable,
	readFilterableDatabaseView,
	useFilterableDatabaseStateStore,
	writeFilterableDatabaseTable,
	type FilterableDatabaseViewPatch,
	type FilterableDatabaseViewState,
} from "./useFilterableDatabaseStateStore";

export interface FilterTreeNode {
	value: string;
	label: string;
	color?: string;
}

export interface FilterTreeGroup {
	filterIndex: number;
	label: string;
	nodes: FilterTreeNode[];
	type?: "color" | "text";
}

export type {ActiveFilterTag};
export type FilterableDatabaseScrollingApi = ReturnType<
	typeof createFilterableDatabaseScrollingApi
>;

const FILTER_TEXT_DEBOUNCE_MS = 300;

/** Search and scroll state of the paged list, saved per parameter. */
export interface FilterableDatabaseListPersistence {
	read(): FilterableDatabaseViewState | undefined;
	save(
		patch: Pick<
			FilterableDatabaseViewPatch,
			"searchText" | "searchAnchors" | "appliedSearchTerms" | "scrollTop"
		>,
	): void;
}

function createScrollingApiForView(
	table: DatabaseTable,
	settings: IFilterableDatabaseSettings,
	selection: FilterSelection,
	view: FilterableDatabaseViewState | undefined,
	pageSize: number,
	itemData: Record<string, ISelectComponentItemDataType> | undefined,
): FilterableDatabaseScrollingApi {
	return createFilterableDatabaseScrollingApi({
		table,
		settings,
		selection,
		pageSize,
		itemData,
		searchTerms: view?.appliedSearchTerms,
		loadedCount: view?.loadedCount,
	});
}

/** What the current table and scrolling API were built for. */
function buildKey(settingsKey: string, pageSize: number, buildApi: boolean) {
	return `${pageSize}|${buildApi}|${settingsKey}`;
}

export function useFilterableDatabase(
	settings: IFilterableDatabaseSettings,
	options?: {
		pageSize?: number;
		/** Grasshopper itemData patch applied to matching database rows. */
		itemData?: Record<string, ISelectComponentItemDataType>;
		/**
		 * Build the in-memory paging structure. Set false when the widget
		 * renders the full catalog list (dropdown, color, chips, checklist…).
		 */
		buildScrollingApi?: boolean;
		/**
		 * Keeps filters, loaded pages, search, and scroll offset while the
		 * control is unmounted or idle. Pass `namespace:parameterId`.
		 */
		persistenceKey?: string;
	},
) {
	const pageSize = options?.pageSize ?? 20;
	const buildApi = options?.buildScrollingApi ?? true;
	const persistenceKey = options?.persistenceKey;
	const settingsKey = filterableDatabaseSettingsKey(settings);
	const itemDataKey = JSON.stringify(options?.itemData ?? null);

	// With a cached table the saved view is rebuilt during the first render,
	// so a remount shows no loader and the list keeps its length.
	const [initial] = useState(() => {
		const view = readFilterableDatabaseView(persistenceKey, settingsKey);
		const selection = view?.selection ?? {};
		const table = readFilterableDatabaseTable(
			persistenceKey,
			settings,
			settingsKey,
		);
		const scrollingApi =
			table && buildApi
				? createScrollingApiForView(
						table,
						settings,
						selection,
						view,
						pageSize,
						options?.itemData,
					)
				: undefined;

		return {selection, table, scrollingApi};
	});

	const [loading, setLoading] = useState(!initial.table);
	const [error, setError] = useState<Error | undefined>();
	const [table, setTable] = useState<DatabaseTable | undefined>(
		initial.table,
	);
	const [selection, setSelection] = useState<FilterSelection>(
		initial.selection,
	);
	const [scrollingApi, setScrollingApi] = useState<
		FilterableDatabaseScrollingApi | undefined
	>(initial.scrollingApi);
	/** Bumped when a new table or scrolling API replaces the shown one. */
	const [viewVersion, setViewVersion] = useState(0);
	/**
	 * Definition the shown table, selection, and list were built for. Lags
	 * `settingsKey` while a changed definition loads; saves are bound to it so
	 * the old list cannot write into the new definition's view.
	 */
	const [shownSettingsKey, setShownSettingsKey] = useState<
		string | undefined
	>(initial.table ? settingsKey : undefined);
	const shownSettingsKeyRef = useRef(shownSettingsKey);
	const scrollingApiRef = useRef(initial.scrollingApi);
	const builtForRef = useRef<string | undefined>(
		initial.table ? buildKey(settingsKey, pageSize, buildApi) : undefined,
	);
	const filterTextTimerRef = useRef<
		ReturnType<typeof setTimeout> | undefined
	>(undefined);
	const pendingFilterTextRef = useRef<
		{filterIndex: number; text: string} | undefined
	>(undefined);

	const settingsRef = useRef(settings);
	settingsRef.current = settings;
	const selectionRef = useRef(selection);
	selectionRef.current = selection;
	const itemDataRef = useRef(options?.itemData);
	itemDataRef.current = options?.itemData;
	const appliedItemDataKeyRef = useRef<string | undefined>(
		initial.scrollingApi ? itemDataKey : undefined,
	);
	const persistenceKeyRef = useRef(persistenceKey);
	persistenceKeyRef.current = persistenceKey;
	const settingsKeyRef = useRef(settingsKey);
	settingsKeyRef.current = settingsKey;

	/**
	 * Save for the definition a value belongs to (the shown one). Skipped
	 * while a changed definition loads and for late cleanups of an old list,
	 * so old filters, search, rows, or scroll never seed the new view.
	 */
	const saveView = useCallback(
		(
			forSettingsKey: string | undefined,
			patch: FilterableDatabaseViewPatch,
		) => {
			const key = persistenceKeyRef.current;
			if (
				!key ||
				!forSettingsKey ||
				settingsKeyRef.current !== forSettingsKey
			) {
				return;
			}

			useFilterableDatabaseStateStore
				.getState()
				.saveView(key, forSettingsKey, patch);
		},
		[],
	);

	const listPersistence = useMemo<
		FilterableDatabaseListPersistence | undefined
	>(
		() =>
			persistenceKey && shownSettingsKey
				? {
						read: () =>
							readFilterableDatabaseView(
								persistenceKey,
								shownSettingsKey,
							),
						save: (patch) => saveView(shownSettingsKey, patch),
					}
				: undefined,
		[persistenceKey, shownSettingsKey, saveView],
	);

	useEffect(() => {
		const built = buildKey(settingsKey, pageSize, buildApi);
		// Built during the first render, or kept while the control was idle.
		if (builtForRef.current === built) {
			return;
		}
		// The load (or error) below replaces what is shown. If it is cancelled
		// or fails and the definition changes back, the old build must not
		// count as current: that would skip `show()` and leave the loader or
		// the error on screen.
		builtForRef.current = undefined;

		// A text filter typed for the old definition must not land in the new one.
		if (
			shownSettingsKeyRef.current !== undefined &&
			shownSettingsKeyRef.current !== settingsKey
		) {
			clearTimeout(filterTextTimerRef.current);
			filterTextTimerRef.current = undefined;
			pendingFilterTextRef.current = undefined;
		}

		const currentSettings = settingsRef.current;
		const view = readFilterableDatabaseView(persistenceKey, settingsKey);
		const nextSelection = persistenceKey
			? (view?.selection ?? {})
			: selectionRef.current;

		function show(parsed: DatabaseTable) {
			const api = buildApi
				? createScrollingApiForView(
						parsed,
						currentSettings,
						nextSelection,
						view,
						pageSize,
						itemDataRef.current,
					)
				: undefined;
			appliedItemDataKeyRef.current = JSON.stringify(
				itemDataRef.current ?? null,
			);
			builtForRef.current = built;
			shownSettingsKeyRef.current = settingsKey;
			setShownSettingsKey(settingsKey);
			scrollingApiRef.current = api;
			selectionRef.current = nextSelection;
			setSelection(nextSelection);
			setTable(parsed);
			setScrollingApi(api);
			setViewVersion((version) => version + 1);
			setError(undefined);
			setLoading(false);
		}

		const cachedTable = readFilterableDatabaseTable(
			persistenceKey,
			currentSettings,
			settingsKey,
		);
		if (cachedTable) {
			show(cachedTable);
			return;
		}

		if (!hasDataSource(currentSettings)) {
			setLoading(false);
			setError(new Error("database.dataSource requires href or export"));
			return;
		}

		let cancelled = false;

		async function load() {
			setLoading(true);
			setError(undefined);

			try {
				const raw = await fetchRawText(currentSettings);
				const parsed =
					resolveFilterableDatabaseEngine(currentSettings).parse(raw);

				if (cancelled) {
					return;
				}

				writeFilterableDatabaseTable(
					persistenceKey,
					currentSettings,
					settingsKey,
					parsed,
				);
				show(parsed);
			} catch (err) {
				if (cancelled) {
					return;
				}

				setError(err instanceof Error ? err : new Error(String(err)));
				setTable(undefined);
				scrollingApiRef.current = undefined;
				setScrollingApi(undefined);
				setLoading(false);
			}
		}

		void load();

		return () => {
			cancelled = true;
		};
	}, [settingsKey, pageSize, persistenceKey, buildApi]);

	// Remember how many rows were shown when the control hides or unmounts.
	useEffect(() => {
		if (!scrollingApi) {
			return;
		}

		const forSettingsKey = shownSettingsKeyRef.current;
		return () => {
			saveView(forSettingsKey, {loadedCount: scrollingApi.items.length});
		};
	}, [scrollingApi, saveView]);

	useEffect(() => {
		return () => {
			if (filterTextTimerRef.current) {
				clearTimeout(filterTextTimerRef.current);
				filterTextTimerRef.current = undefined;
			}

			// Commit a text filter that is still waiting for its debounce.
			const pending = pendingFilterTextRef.current;
			if (!pending) {
				return;
			}

			pendingFilterTextRef.current = undefined;
			const trimmed = pending.text.trim();
			const next = {
				...selectionRef.current,
				[pending.filterIndex]: trimmed ? [trimmed] : [],
			};
			selectionRef.current = next;
			scrollingApiRef.current?.updateSelection(next);
			saveView(shownSettingsKeyRef.current, {selection: next});
			setSelection(next);
		};
	}, [saveView]);

	useEffect(() => {
		const api = scrollingApiRef.current;
		if (!api) {
			return;
		}
		if (appliedItemDataKeyRef.current === itemDataKey) {
			return;
		}
		appliedItemDataKeyRef.current = itemDataKey;
		api.updateItemData(itemDataRef.current);
	}, [itemDataKey, scrollingApi]);

	const applySelection = useCallback(
		(updater: (prev: FilterSelection) => FilterSelection) => {
			setSelection((prev) => {
				const next = updater(prev);
				selectionRef.current = next;
				scrollingApiRef.current?.updateSelection(next);
				saveView(shownSettingsKeyRef.current, {selection: next});
				return next;
			});
		},
		[saveView],
	);

	const filterGroups = useMemo((): FilterTreeGroup[] => {
		if (!table) {
			return [];
		}

		return settings.filters.map((filter, filterIndex) => ({
			filterIndex,
			label: filter.label?.trim() || `Filter ${filterIndex + 1}`,
			type: filter.type,
			nodes:
				filter.type === "text"
					? []
					: extractFilterOptions(table, filter, filterIndex).map(
							({value, label}) => ({
								value,
								label,
								...(filter.type === "color"
									? {color: value}
									: {}),
							}),
						),
		}));
	}, [table, settings.filters]);

	const setFilterValue = useCallback(
		(filterIndex: number, values: string[]) => {
			applySelection((prev) => ({
				...prev,
				[filterIndex]: values,
			}));
		},
		[applySelection],
	);

	const toggleFilterValue = useCallback(
		(filterIndex: number, value: string) => {
			const filter = settings.filters[filterIndex];
			if (!filter) {
				return;
			}

			applySelection((prev) => {
				const current = prev[filterIndex] ?? [];
				const next = toggleFilterSelection(
					current,
					value,
					filter.multiple,
				);
				return {...prev, [filterIndex]: next};
			});
		},
		[applySelection, settings.filters],
	);

	const setFilterText = useCallback(
		(filterIndex: number, text: string) => {
			if (filterTextTimerRef.current) {
				clearTimeout(filterTextTimerRef.current);
			}

			pendingFilterTextRef.current = {filterIndex, text};
			filterTextTimerRef.current = setTimeout(() => {
				pendingFilterTextRef.current = undefined;
				const trimmed = text.trim();
				setFilterValue(filterIndex, trimmed ? [trimmed] : []);
				filterTextTimerRef.current = undefined;
			}, FILTER_TEXT_DEBOUNCE_MS);
		},
		[setFilterValue],
	);

	const removeFilterValue = useCallback(
		(filterIndex: number, value: string) => {
			const filter = settings.filters[filterIndex];
			if (filter?.type === "text") {
				if (filterTextTimerRef.current) {
					clearTimeout(filterTextTimerRef.current);
					filterTextTimerRef.current = undefined;
				}
				pendingFilterTextRef.current = undefined;
			}

			applySelection((prev) => {
				const current = prev[filterIndex] ?? [];
				const next = current.filter((entry) => entry !== value);
				return {...prev, [filterIndex]: next};
			});
		},
		[applySelection, settings.filters],
	);

	const toggleSelectAll = useCallback(
		(filterIndex: number) => {
			const filter = settings.filters[filterIndex];
			if (
				!filter ||
				filter.type === "text" ||
				filter.multiple === false
			) {
				return;
			}

			const group = filterGroups.find(
				(entry) => entry.filterIndex === filterIndex,
			);
			if (!group) {
				return;
			}

			const allValues = group.nodes.map((node) => node.value);
			applySelection((prev) => {
				const current = prev[filterIndex] ?? [];
				const state = getSelectAllState(current, allValues);
				const next = applySelectAll(allValues, state !== "checked");
				return {...prev, [filterIndex]: next};
			});
		},
		[applySelection, filterGroups, settings.filters],
	);

	const activeFilterTags = useMemo(
		() => buildActiveFilterTags(selection, filterGroups),
		[selection, filterGroups],
	);

	return {
		loading,
		error,
		table,
		selection,
		setFilterValue,
		setFilterText,
		toggleFilterValue,
		toggleSelectAll,
		removeFilterValue,
		activeFilterTags,
		filterGroups,
		scrollingApi,
		listPersistence,
		viewVersion,
	};
}
