import {
	IAppBuilderWidgetPropsTable,
	IAppBuilderWidgetPropsTableColumn,
} from "@AppBuilderLib/widgets/appbuilder/config/appbuildertable";
import {
	Box,
	BoxProps,
	MantineThemeComponent,
	Table,
	TableProps,
	TextInput,
	TextInputProps,
	useProps,
} from "@mantine/core";
import {useDebouncedValue} from "@mantine/hooks";
import {
	RankingInfo,
	compareItems,
	rankItem,
} from "@tanstack/match-sorter-utils";
import {
	ColumnDef,
	ColumnFiltersState,
	FilterFn,
	SortingFn,
	SortingState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	sortingFns,
	useReactTable,
} from "@tanstack/react-table";
import {useVirtualizer} from "@tanstack/react-virtual";
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";

function useElementHeight(ref: React.RefObject<HTMLElement | null>): number {
	const [height, setHeight] = useState(0);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const observer = new ResizeObserver(([entry]) => {
			setHeight(entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height);
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, [ref]);
	return height;
}

declare module "@tanstack/react-table" {
	interface FilterFns {
		fuzzy: FilterFn<unknown>;
	}
	interface FilterMeta {
		itemRank: RankingInfo;
	}
}

type RecordType = Record<string, unknown>;

const fuzzyFilter: FilterFn<RecordType> = (row, columnId, value, addMeta) => {
	const itemRank = rankItem(row.getValue(columnId), value);
	addMeta({itemRank});
	return itemRank.passed;
};

const fuzzySort: SortingFn<RecordType> = (rowA, rowB, columnId) => {
	let dir = 0;
	if (rowA.columnFiltersMeta[columnId]) {
		dir = compareItems(
			rowA.columnFiltersMeta[columnId].itemRank,
			rowB.columnFiltersMeta[columnId].itemRank,
		);
	}
	return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

const FILTER_FNS = {fuzzy: fuzzyFilter} as const;

const coreRowModel = getCoreRowModel<RecordType>();
const filteredRowModel = getFilteredRowModel<RecordType>();
const sortedRowModel = getSortedRowModel<RecordType>();

type StyleProps = {
	tableProps?: Partial<TableProps>;
	searchTextInputProps?: Partial<TextInputProps>;
	searchBarProps?: Partial<BoxProps>;
};

const defaultStyleProps: StyleProps = {
	tableProps: {},
	searchTextInputProps: {size: "xs"},
	searchBarProps: {
		style: {
			display: "flex",
			gap: 8,
			padding: "4px 0",
		},
	},
};

type AppBuilderTableWidgetComponentThemePropsType = Partial<StyleProps>;

export function AppBuilderTableWidgetComponentThemeProps(
	props: AppBuilderTableWidgetComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

const DEFAULT_ROW_HEIGHT = 34;
const DEFAULT_OVERSCAN = 10;

const scrollContainerStyle: React.CSSProperties = {overflow: "auto"};
const paddingCellStyle = {padding: 0} as const;

const sortableThStyle: React.CSSProperties = {
	cursor: "pointer",
	userSelect: "none",
};

export default function AppBuilderTableWidgetComponent(
	props: IAppBuilderWidgetPropsTable &
		AppBuilderTableWidgetComponentThemePropsType,
) {
	const {
		columns: columnDefs,
		records: allRecords,
		caption,
		highlightOnHover,
		stickyHeader,
		striped,
		withColumnBorders,
		withRowBorders,
		withTableBorder,
		height,
		estimateRowHeight = DEFAULT_ROW_HEIGHT,
		overscan = DEFAULT_OVERSCAN,
		...rest
	} = props;

	const {tableProps, searchTextInputProps, searchBarProps} = useProps(
		"AppBuilderTableWidgetComponent",
		defaultStyleProps,
		rest,
	);
	const searchableColumns = useMemo(
		() => columnDefs.filter((c) => c.searchable),
		[columnDefs],
	);
	const [rawQueries, setRawQueries] = useState<Record<string, string>>(() =>
		Object.fromEntries(searchableColumns.map((c) => [c.accessor, ""])),
	);
	const [debouncedQueries] = useDebouncedValue(rawQueries, 200);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = useState<SortingState>([]);

	useEffect(() => {
		const next: ColumnFiltersState = Object.entries(debouncedQueries)
			.filter(([, v]) => v !== "")
			.map(([id, value]) => ({id, value}));
		setColumnFilters(next);
	}, [debouncedQueries]);

	const columns = useMemo<ColumnDef<RecordType>[]>(
		() =>
			columnDefs.map((col: IAppBuilderWidgetPropsTableColumn) => ({
				id: col.accessor,
				accessorKey: col.accessor,
				header: col.title ?? col.accessor,
				size: typeof col.width === "number" ? col.width : undefined,
				enableSorting: col.sortable ?? false,
				enableColumnFilter: col.searchable ?? false,
				filterFn: "fuzzy" as const,
				sortingFn: fuzzySort,
			})),
		[columnDefs],
	);
	const tableState = useMemo(
		() => ({sorting, columnFilters}),
		[sorting, columnFilters],
	);
	const table = useReactTable<RecordType>({
		data: allRecords,
		columns,
		state: tableState,
		filterFns: FILTER_FNS,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: coreRowModel,
		getFilteredRowModel: filteredRowModel,
		getSortedRowModel: sortedRowModel,
	});
	const {rows} = table.getRowModel();
	const scrollRef = useRef<HTMLDivElement>(null);
	const searchBarRef = useRef<HTMLDivElement>(null);
	const searchBarHeight = useElementHeight(searchBarRef);
	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => estimateRowHeight,
		overscan,
	});
	const virtualItems = virtualizer.getVirtualItems();
	const totalSize = virtualizer.getTotalSize();
	const paddingTop =
		virtualItems.length > 0 ? (virtualItems[0]?.start ?? 0) : 0;
	const paddingBottom =
		virtualItems.length > 0
			? totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0)
			: 0;
	const containerStyle = useMemo<React.CSSProperties>(
		() => ({...scrollContainerStyle, height: height ?? "100%"}),
		[height],
	);
	const handleQueryChange = useCallback(
		(accessor: string, value: string) => {
			setRawQueries((prev) => ({...prev, [accessor]: value}));
		},
		[],
	);
	const colCount = columns.length;
	const {style: searchBarStyleFromProps, ...searchBarRest} =
		searchBarProps ?? {};
	const mergedSearchBarStyle = useMemo<React.CSSProperties>(
		() => ({
			...(searchBarStyleFromProps as React.CSSProperties),
			...(stickyHeader && {
				position: "sticky",
				top: 0,
				zIndex: 1,
				backgroundColor: "var(--mantine-color-body)",
			}),
		}),
		[searchBarStyleFromProps, stickyHeader],
	);

	return (
		<div ref={scrollRef} style={containerStyle}>
			{searchableColumns.length > 0 && (
				<Box
					ref={searchBarRef}
					{...searchBarRest}
					style={mergedSearchBarStyle}
				>
					{searchableColumns.map((col) => (
						<TextInput
							key={col.accessor}
							{...searchTextInputProps}
							placeholder={`Search ${col.title ?? col.accessor}…`}
							value={rawQueries[col.accessor] ?? ""}
							onChange={(e) =>
								handleQueryChange(
									col.accessor,
									e.currentTarget.value,
								)
							}
						/>
					))}
				</Box>
			)}
			<Table
				{...tableProps}
				stickyHeader={stickyHeader}
				stickyHeaderOffset={stickyHeader && searchBarHeight > 0 ? searchBarHeight : undefined}
				striped={striped}
				highlightOnHover={highlightOnHover}
				withColumnBorders={withColumnBorders}
				withRowBorders={withRowBorders}
				withTableBorder={withTableBorder}
				captionSide="bottom"
			>
				<Table.Thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<Table.Tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								const canSort = header.column.getCanSort();
								const sorted = header.column.getIsSorted();
								const size = header.getSize();
								return (
									<Table.Th
										key={header.id}
										style={
											canSort || size !== 150
												? {
														...(canSort
															? sortableThStyle
															: undefined),
														width:
															size !== 150
																? size
																: undefined,
													}
												: undefined
										}
										onClick={
											canSort
												? header.column.getToggleSortingHandler()
												: undefined
										}
									>
										{flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
										{sorted === "asc"
											? " ↑"
											: sorted === "desc"
												? " ↓"
												: null}
									</Table.Th>
								);
							})}
						</Table.Tr>
					))}
				</Table.Thead>
				<Table.Tbody>
					{paddingTop > 0 && (
						<Table.Tr>
							<Table.Td
								colSpan={colCount}
								style={{...paddingCellStyle, height: paddingTop}}
							/>
						</Table.Tr>
					)}
					{virtualItems.map((virtualRow) => {
						const row = rows[virtualRow.index];
						return (
							<Table.Tr key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<Table.Td key={cell.id}>
										{flexRender(
											cell.column.columnDef.cell,
											cell.getContext(),
										)}
									</Table.Td>
								))}
							</Table.Tr>
						);
					})}
					{paddingBottom > 0 && (
						<Table.Tr>
							<Table.Td
								colSpan={colCount}
								style={{
									...paddingCellStyle,
									height: paddingBottom,
								}}
							/>
						</Table.Tr>
					)}
				</Table.Tbody>
				{caption && <Table.Caption>{caption}</Table.Caption>}
			</Table>
		</div>
	);
}
