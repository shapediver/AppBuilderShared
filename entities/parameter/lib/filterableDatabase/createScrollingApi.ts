import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {
	IScrollingApi,
	IScrollingApiItemTypeSelect,
} from "@AppBuilderLib/features/ecommerce/config/scrollingapi";
import {applyFilters} from "./filterLogic";
import {mapRowsToSelectItems} from "./itemMapping";
import type {DatabaseTable, FilterSelection} from "./types";

/** Deep-equal for filter maps so no-op updates skip resetState (avoids clearing the parameter value). */
function isSelectionEqual(a: FilterSelection, b: FilterSelection): boolean {
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

		// Stryker disable next-line EqualityOperator: i <= length reads undefined===undefined
		for (let i = 0; i < valuesA.length; i++) {
			if (valuesA[i] !== valuesB[i]) {
				return false;
			}
		}
	}

	return true;
}

/**
 * Client-side search within the current filtered item list.
 * All terms must match (AND); only item key and displayname are searched (v1).
 */
function matchesSearchTerms(
	entry: IScrollingApiItemTypeSelect,
	terms: string[],
): boolean {
	// Stryker disable next-line ConditionalExpression,BlockStatement,BooleanLiteral: Array#every on [] is also true
	if (terms.length === 0) {
		// Stryker disable next-line BooleanLiteral: unreachable — buildAllItems already returns on empty terms
		return true;
	}

	// itemData is always an object from mapRowsToSelectItems
	// Stryker disable next-line OptionalChaining: data is never undefined here
	const haystack = [entry.item, entry.data?.displayname ?? ""]
		.join(" ")
		.toLowerCase();

	return terms.every((term) => haystack.includes(term.toLowerCase()));
}

/**
 * In-memory adapter implementing {@link IScrollingApi} for filterable database rows.
 * Mutates `api.items` in place; consumers must watch `resetState` to re-render.
 */
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
	// Stryker disable next-line ArrayDeclaration: applyPaging overwrites before return
	let allItems: IScrollingApiItemTypeSelect[] = [];
	let loadedCount = 0;
	let resetStateCounter = 0;

	/** Filter rows → map to select items → optionally narrow by search terms. */
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

	/** Rebuilds the full list and exposes only the first page via `api.items`. */
	function applyPaging() {
		allItems = buildAllItems();
		loadedCount = Math.min(pageSize, allItems.length);
		api.items = allItems.slice(0, loadedCount);
		api.hasNextPage = loadedCount < allItems.length;
	}

	/** Signals React hooks that in-place item data changed (filter, search, or reload). */
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
		// Stryker disable next-line BooleanLiteral: applyPaging overwrites before return
		hasNextPage: false,
		// Stryker disable next-line ArrayDeclaration: applyPaging overwrites before return
		items: [],
		resetState: 0,
		/** Appends the next page slice without rebuilding the filtered list. */
		loadMore: async () => {
			if (!api.hasNextPage || api.loading) {
				return;
			}

			// loadMore is fully synchronous; loading is not observable between assignments
			// Stryker disable next-line BooleanLiteral: set true then false in the same tick
			api.loading = true;
			loadedCount = Math.min(loadedCount + pageSize, allItems.length);
			api.items = allItems.slice(0, loadedCount);
			api.hasNextPage = loadedCount < allItems.length;
			// Stryker disable next-line BooleanLiteral: set true then false in the same tick
			api.loading = false;
			bumpResetState();
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
