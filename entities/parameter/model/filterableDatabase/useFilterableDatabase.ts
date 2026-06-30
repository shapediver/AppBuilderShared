import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
	buildActiveFilterTags,
	type ActiveFilterTag,
} from "../../lib/filterableDatabase/buildActiveFilterTags";
import {createFilterableDatabaseScrollingApi} from "../../lib/filterableDatabase/createScrollingApi";
import {
	applySelectAll,
	extractFilterValues,
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
type FilterableDatabaseScrollingApi = ReturnType<
	typeof createFilterableDatabaseScrollingApi
>;

const FILTER_TEXT_DEBOUNCE_MS = 300;

export function useFilterableDatabase(
	settings: IFilterableDatabaseSettings,
	options?: {pageSize?: number},
) {
	const pageSize = options?.pageSize ?? 20;
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | undefined>();
	const [table, setTable] = useState<DatabaseTable | undefined>();
	const [selection, setSelection] = useState<FilterSelection>({});
	const scrollingApiRef = useRef<FilterableDatabaseScrollingApi | undefined>(
		undefined,
	);
	const filterTextTimerRef = useRef<
		ReturnType<typeof setTimeout> | undefined
	>(undefined);
	const [scrollingApi, setScrollingApi] = useState<
		FilterableDatabaseScrollingApi | undefined
	>(undefined);

	const {href, export: exportRef, format} = settings.dataSource;
	const filtersKey = JSON.stringify(settings.filters);
	const itemDataDefinitionKey = JSON.stringify(settings.itemDataDefinition);
	const settingsRef = useRef(settings);
	settingsRef.current = settings;
	const selectionRef = useRef(selection);
	selectionRef.current = selection;

	useEffect(() => {
		const currentSettings = settingsRef.current;

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

				setTable(parsed);

				const api = createFilterableDatabaseScrollingApi({
					table: parsed,
					settings: currentSettings,
					selection: selectionRef.current,
					pageSize,
				});
				scrollingApiRef.current = api;
				setScrollingApi(api);
			} catch (err) {
				if (cancelled) {
					return;
				}

				setError(err instanceof Error ? err : new Error(String(err)));
				setTable(undefined);
				scrollingApiRef.current = undefined;
				setScrollingApi(undefined);
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		void load();

		return () => {
			cancelled = true;
		};
	}, [
		href,
		exportRef?.name,
		exportRef?.sessionId,
		format,
		filtersKey,
		itemDataDefinitionKey,
		pageSize,
	]);

	useEffect(() => {
		return () => {
			if (filterTextTimerRef.current) {
				clearTimeout(filterTextTimerRef.current);
			}
		};
	}, []);

	const applySelection = useCallback(
		(updater: (prev: FilterSelection) => FilterSelection) => {
			setSelection((prev) => {
				const next = updater(prev);
				scrollingApiRef.current?.updateSelection(next);
				return next;
			});
		},
		[],
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
					: extractFilterValues(table, filter).map((value) => ({
							value,
							label: value,
							...(filter.type === "color" ? {color: value} : {}),
						})),
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

			filterTextTimerRef.current = setTimeout(() => {
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
		selection,
		setFilterValue,
		setFilterText,
		toggleFilterValue,
		toggleSelectAll,
		removeFilterValue,
		activeFilterTags,
		filterGroups,
		scrollingApi,
	};
}
