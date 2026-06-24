import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {
	IScrollingApi,
	IScrollingApiItemTypeSelect,
} from "@AppBuilderLib/features/ecommerce/config/scrollingapi";
import {applyFilters} from "./filterLogic";
import {mapRowsToSelectItems} from "./itemMapping";
import type {DatabaseTable, FilterSelection} from "./types";

function isSelectionEqual(
	a: FilterSelection,
	b: FilterSelection,
): boolean {
	const keysA = Object.keys(a);
	const keysB = Object.keys(b);

	if (keysA.length !== keysB.length) {
		return false;
	}

	for (const key of keysA) {
		const index = Number(key);
		const valuesA = a[index] ?? [];
		const valuesB = b[index] ?? [];

		if (valuesA.length !== valuesB.length) {
			return false;
		}

		for (let i = 0; i < valuesA.length; i++) {
			if (valuesA[i] !== valuesB[i]) {
				return false;
			}
		}
	}

	return true;
}

function matchesSearchTerms(
	entry: IScrollingApiItemTypeSelect,
	terms: string[],
): boolean {
	if (terms.length === 0) {
		return true;
	}

	const haystack = [entry.item, entry.data?.displayname ?? ""]
		.join(" ")
		.toLowerCase();

	return terms.every((term) => haystack.includes(term.toLowerCase()));
}

export function createFilterableDatabaseScrollingApi(options: {
	table: DatabaseTable;
	settings: IFilterableDatabaseSettings;
	selection: FilterSelection;
	pageSize?: number;
}): IScrollingApi<IScrollingApiItemTypeSelect> & {
	updateSelection(selection: FilterSelection): void;
	updateTable(table: DatabaseTable): void;
} {
	let table = options.table;
	let selection = options.selection;
	const settings = options.settings;
	let pageSize = options.pageSize ?? 20;
	let searchTerms: string[] = [];
	let allItems: IScrollingApiItemTypeSelect[] = [];
	let loadedCount = 0;
	let resetStateCounter = 0;

	function buildAllItems(): IScrollingApiItemTypeSelect[] {
		const filteredRows = applyFilters(table, settings.filters, selection);
		const {items, itemData} = mapRowsToSelectItems(
			filteredRows,
			settings.itemDataDefinition,
		);

		const mapped = items.map((item) => ({
			item,
			data: itemData[item],
		}));

		if (searchTerms.length === 0) {
			return mapped;
		}

		return mapped.filter((entry) => matchesSearchTerms(entry, searchTerms));
	}

	function applyPaging() {
		allItems = buildAllItems();
		loadedCount = Math.min(pageSize, allItems.length);
		api.items = allItems.slice(0, loadedCount);
		api.hasNextPage = loadedCount < allItems.length;
	}

	function bumpResetState() {
		resetStateCounter += 1;
		api.resetState = resetStateCounter;
	}

	const api: IScrollingApi<IScrollingApiItemTypeSelect> & {
		updateSelection(selection: FilterSelection): void;
		updateTable(table: DatabaseTable): void;
	} = {
		loading: false,
		error: undefined,
		hasNextPage: false,
		items: [],
		resetState: 0,
		loadMore: async () => {
			if (!api.hasNextPage) {
				return;
			}

			loadedCount = Math.min(loadedCount + pageSize, allItems.length);
			api.items = allItems.slice(0, loadedCount);
			api.hasNextPage = loadedCount < allItems.length;
		},
		setSearchTerms: async (terms: string[]) => {
			searchTerms = terms;
			applyPaging();
			bumpResetState();
		},
		setPageSize: async (size: number) => {
			pageSize = size;
			applyPaging();
		},
		reset: () => {
			loadedCount = Math.min(pageSize, allItems.length);
			api.items = allItems.slice(0, loadedCount);
			api.hasNextPage = loadedCount < allItems.length;
			bumpResetState();
		},
		updateSelection(nextSelection: FilterSelection) {
			if (isSelectionEqual(selection, nextSelection)) {
				return;
			}

			selection = nextSelection;
			applyPaging();
			bumpResetState();
		},
		updateTable(nextTable: DatabaseTable) {
			table = nextTable;
			applyPaging();
			bumpResetState();
		},
	};

	applyPaging();

	return api;
}
