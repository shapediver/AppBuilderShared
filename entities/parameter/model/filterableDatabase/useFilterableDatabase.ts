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

export function useFilterableDatabase(settings: IFilterableDatabaseSettings) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | undefined>();
	const [table, setTable] = useState<DatabaseTable | undefined>();
	const [selection, setSelection] = useState<FilterSelection>({});
	const scrollingApiRef = useRef<FilterableDatabaseScrollingApi | undefined>(
		undefined,
	);
	const [scrollingApi, setScrollingApi] = useState<
		FilterableDatabaseScrollingApi | undefined
	>(undefined);

	const {href, export: exportRef, format} = settings.dataSource;

	useEffect(() => {
		if (!hasDataSource(settings)) {
			setLoading(false);
			setError(new Error("database.dataSource requires href or export"));
			return;
		}

		let cancelled = false;

		async function load() {
			setLoading(true);
			setError(undefined);

			try {
				const raw = await fetchRawText(settings);
				const parsed =
					resolveFilterableDatabaseEngine(settings).parse(raw);

				if (cancelled) {
					return;
				}

				setTable(parsed);

				const api = createFilterableDatabaseScrollingApi({
					table: parsed,
					settings,
					selection: {},
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
	}, [href, exportRef?.name, exportRef?.sessionId, format, settings]);

	useEffect(() => {
		const api = scrollingApiRef.current;
		if (!api) {
			return;
		}

		api.updateSelection(selection);
		setScrollingApi({...api});
	}, [selection]);

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
			setSelection((prev) => ({
				...prev,
				[filterIndex]: values,
			}));
		},
		[],
	);

	const toggleFilterValue = useCallback(
		(filterIndex: number, value: string) => {
			const filter = settings.filters[filterIndex];
			if (!filter) {
				return;
			}

			setSelection((prev) => {
				const current = prev[filterIndex] ?? [];
				const next = toggleFilterSelection(
					current,
					value,
					filter.multiple,
				);
				return {...prev, [filterIndex]: next};
			});
		},
		[settings.filters],
	);

	const setFilterText = useCallback(
		(filterIndex: number, text: string) => {
			const trimmed = text.trim();
			setFilterValue(filterIndex, trimmed ? [trimmed] : []);
		},
		[setFilterValue],
	);

	const removeFilterValue = useCallback(
		(filterIndex: number, value: string) => {
			setSelection((prev) => {
				const current = prev[filterIndex] ?? [];
				const next = current.filter((entry) => entry !== value);
				return {...prev, [filterIndex]: next};
			});
		},
		[],
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
			setSelection((prev) => {
				const current = prev[filterIndex] ?? [];
				const state = getSelectAllState(current, allValues);
				const next = applySelectAll(allValues, state !== "checked");
				return {...prev, [filterIndex]: next};
			});
		},
		[filterGroups, settings.filters],
	);

	const activeFilterTags = useMemo(
		() => buildActiveFilterTags(selection, filterGroups),
		[selection, filterGroups],
	);

	const syncScrollingApiState = useCallback(() => {
		const api = scrollingApiRef.current;
		if (api) {
			setScrollingApi({...api});
		}
	}, []);

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
		syncScrollingApiState,
	};
}
