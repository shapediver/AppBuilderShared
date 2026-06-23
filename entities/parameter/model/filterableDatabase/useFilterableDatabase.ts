import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {createFilterableDatabaseScrollingApi} from "../../lib/filterableDatabase/createScrollingApi";
import {csvEngine} from "../../lib/filterableDatabase/csvEngine";
import {extractFilterValues} from "../../lib/filterableDatabase/filterLogic";
import type {
	DatabaseTable,
	FilterSelection,
} from "../../lib/filterableDatabase/types";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

export interface FilterTreeNode {
	value: string;
	label: string;
	color?: string;
}

export interface FilterTreeGroup {
	filterIndex: number;
	label: string;
	nodes: FilterTreeNode[];
	type?: "color";
}

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

	const href = settings.dataSource.href;

	useEffect(() => {
		if (!href) {
			setLoading(false);
			setError(new Error("Missing database dataSource href"));
			return;
		}

		let cancelled = false;

		async function load() {
			if (!href) {
				return;
			}

			setLoading(true);
			setError(undefined);

			try {
				const raw = await csvEngine.fetch(href);
				const parsed = csvEngine.parse(raw);

				if (cancelled) {
					return;
				}

				setTable(parsed);
				setSelection({});

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
	}, [href, settings]);

	useEffect(() => {
		scrollingApiRef.current?.updateSelection(selection);
	}, [selection]);

	const filterGroups = useMemo((): FilterTreeGroup[] => {
		if (!table) {
			return [];
		}

		return settings.filters.map((filter, filterIndex) => ({
			filterIndex,
			label: `Filter ${filterIndex + 1}`,
			type: filter.type,
			nodes: extractFilterValues(table, filter).map((value) => ({
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

				if (filter.multiple) {
					const next = current.includes(value)
						? current.filter((entry) => entry !== value)
						: [...current, value];
					return {...prev, [filterIndex]: next};
				}

				const next =
					current.length === 1 && current[0] === value ? [] : [value];
				return {...prev, [filterIndex]: next};
			});
		},
		[settings.filters],
	);

	return {
		loading,
		error,
		selection,
		setFilterValue,
		toggleFilterValue,
		filterGroups,
		scrollingApi,
	};
}
