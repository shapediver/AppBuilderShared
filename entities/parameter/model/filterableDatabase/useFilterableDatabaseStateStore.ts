import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {devtoolsSettings} from "@AppBuilderLib/shared/config/storeSettings";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import type {
	DatabaseTable,
	FilterSelection,
} from "../../lib/filterableDatabase/types";

/** Identity of the database definition. A change drops the saved view. */
export function filterableDatabaseSettingsKey(
	settings: IFilterableDatabaseSettings,
): string {
	const {href, export: exportRef, format} = settings.dataSource;

	return JSON.stringify({
		href,
		exportName: exportRef?.name,
		exportSessionId: exportRef?.sessionId,
		format,
		filters: settings.filters,
		itemDataDefinition: settings.itemDataDefinition,
	});
}

const KEY_SEPARATOR = ":";

/** One entry per parameter, shared by every mount of that control. */
export function filterableDatabasePersistenceKey(
	namespace: string,
	parameterId: string,
): string {
	return `${namespace}${KEY_SEPARATOR}${parameterId}`;
}

/**
 * What a filterable database control shows, as plain data.
 * Kept outside the widget so hiding a container (unmount) or idling it
 * (Activity tears down effects) does not start the list over.
 * The rows themselves are rebuilt from the table on remount.
 */
export interface FilterableDatabaseViewState {
	settingsKey: string;
	selection: FilterSelection;
	/** Number of rows shown (loaded pages), restored by the scrolling API. */
	loadedCount: number;
	/** Text in the search field, not yet an anchor. */
	searchText: string;
	searchAnchors: string[];
	/**
	 * Search terms applied to the list. Not always anchors + field text:
	 * adding or removing an anchor applies only the anchors.
	 */
	appliedSearchTerms: string[];
	/** Offset of the list's own scroll container (only when `height` is set). */
	scrollTop: number;
}

export type FilterableDatabaseViewPatch = Partial<
	Omit<FilterableDatabaseViewState, "settingsKey">
>;

interface FilterableDatabaseStateStore {
	views: Record<string, FilterableDatabaseViewState>;
	/** Merge into the view. A different `settingsKey` starts from a blank view. */
	saveView: (
		key: string,
		settingsKey: string,
		patch: FilterableDatabaseViewPatch,
	) => void;
	/**
	 * Drop every view of one session. Saves for it are ignored until
	 * `openNamespace`, so controls that unmount after the session was
	 * removed cannot write their view back.
	 */
	removeNamespace: (namespace: string) => void;
	/** Accept saves for a session again (it was added back). */
	openNamespace: (namespace: string) => void;
}

function blankView(settingsKey: string): FilterableDatabaseViewState {
	return {
		settingsKey,
		selection: {},
		loadedCount: 0,
		searchText: "",
		searchAnchors: [],
		appliedSearchTerms: [],
		scrollTop: 0,
	};
}

/**
 * Parsed tables of static `href` sources, per parameter.
 * Outside Zustand so devtools do not serialize whole catalogs on every write.
 * Export sources are not cached: their content changes with each computation.
 */
const hrefTables = new Map<
	string,
	{settingsKey: string; table: DatabaseTable}
>();

/** Sessions removed and not added back yet. */
const closedNamespaces = new Set<string>();

function isInNamespace(key: string, namespace: string): boolean {
	return key.startsWith(`${namespace}${KEY_SEPARATOR}`);
}

function isClosed(key: string): boolean {
	for (const namespace of closedNamespaces) {
		if (isInNamespace(key, namespace)) {
			return true;
		}
	}
	return false;
}

export const useFilterableDatabaseStateStore =
	create<FilterableDatabaseStateStore>()(
		devtools(
			(set, get) => ({
				views: {},

				saveView: (key, settingsKey, patch) => {
					if (isClosed(key)) {
						return;
					}

					const prev = get().views[key];
					const base =
						prev?.settingsKey === settingsKey
							? prev
							: blankView(settingsKey);

					set(
						{views: {...get().views, [key]: {...base, ...patch}}},
						false,
						"filterableDatabase/saveView",
					);
				},

				removeNamespace: (namespace) => {
					closedNamespaces.add(namespace);
					for (const key of [...hrefTables.keys()]) {
						if (isInNamespace(key, namespace)) {
							hrefTables.delete(key);
						}
					}

					const views = get().views;
					const keys = Object.keys(views).filter((key) =>
						isInNamespace(key, namespace),
					);
					if (keys.length === 0) {
						return;
					}

					const next = {...views};
					keys.forEach((key) => delete next[key]);
					set(
						{views: next},
						false,
						"filterableDatabase/removeNamespace",
					);
				},

				openNamespace: (namespace) => {
					closedNamespaces.delete(namespace);
				},
			}),
			{...devtoolsSettings, name: "AppBuilder | Filterable database"},
		),
	);

/** Saved view for this parameter when it still matches the database definition. */
export function readFilterableDatabaseView(
	key: string | undefined,
	settingsKey: string,
): FilterableDatabaseViewState | undefined {
	if (!key) {
		return undefined;
	}

	const view = useFilterableDatabaseStateStore.getState().views[key];
	return view?.settingsKey === settingsKey ? view : undefined;
}

/** Cached table for a static `href` source, or undefined. */
export function readFilterableDatabaseTable(
	key: string | undefined,
	settings: IFilterableDatabaseSettings,
	settingsKey: string,
): DatabaseTable | undefined {
	if (!key || !settings.dataSource.href) {
		return undefined;
	}

	const entry = hrefTables.get(key);
	return entry?.settingsKey === settingsKey ? entry.table : undefined;
}

export function writeFilterableDatabaseTable(
	key: string | undefined,
	settings: IFilterableDatabaseSettings,
	settingsKey: string,
	table: DatabaseTable,
) {
	if (!key || !settings.dataSource.href || isClosed(key)) {
		return;
	}

	hrefTables.set(key, {settingsKey, table});
}

/** Test helper: forget every saved view and cached table. */
export function resetFilterableDatabaseState() {
	hrefTables.clear();
	closedNamespaces.clear();
	useFilterableDatabaseStateStore.setState({views: {}});
}
