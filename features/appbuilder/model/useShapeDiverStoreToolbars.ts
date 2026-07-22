import {devtoolsSettings} from "@AppBuilderLib/shared/config/storeSettings";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {
	IShapeDiverStoreToolbars,
	ToolbarRegistration,
	ToolbarRuntimeTarget,
	ToolbarRuntimeTokenEntry,
} from "../config/shapediverStoreToolbars";

const DEFAULT_SIDE = "top" as const;
const DEFAULT_ALIGN = "center" as const;
const DEFAULT_VISIBILITY = "always" as const;
const DEFAULT_RUNTIME_GROUP_INDEX = 0;

type ToolbarStoreState = Pick<
	IShapeDiverStoreToolbars,
	| "definitionToolbars"
	| "defaultToolbars"
	| "runtimeToolbars"
	| "runtimeTokens"
>;

type ToolbarInput = Partial<ToolbarRegistration> & {
	id: string;
	source: ToolbarRegistration["source"];
};

const generateToken = () => Math.random().toString(36).slice(2);

const cloneGroups = (groups: ToolbarRegistration["groups"] | undefined) =>
	groups ? groups.map((group) => [...group]) : [];

const normalizeToolbar = (toolbar: ToolbarInput): ToolbarRegistration => ({
	id: toolbar.id,
	source: toolbar.source,
	viewportId: toolbar.viewportId,
	side: toolbar.side ?? DEFAULT_SIDE,
	align: toolbar.align ?? DEFAULT_ALIGN,
	order: toolbar.order ?? 0,
	definitionIndex: toolbar.definitionIndex,
	visibility: toolbar.visibility ?? DEFAULT_VISIBILITY,
	ariaLabel: toolbar.ariaLabel,
	defaultIcon: toolbar.defaultIcon,
	groups: cloneGroups(toolbar.groups),
});

const normalizeDefinitionToolbars = (
	toolbars: ToolbarRegistration[],
): ToolbarRegistration[] =>
	toolbars.map((toolbar, definitionIndex) =>
		normalizeToolbar({
			...toolbar,
			source: toolbar.source ?? "definition",
			definitionIndex: toolbar.definitionIndex ?? definitionIndex,
		}),
	);

const toolbarMatchesViewport = (
	toolbar: ToolbarRegistration,
	viewportId?: string,
) => !toolbar.viewportId || !viewportId || toolbar.viewportId === viewportId;

const compareToolbars = (a: ToolbarRegistration, b: ToolbarRegistration) => {
	if (a.order !== b.order) return a.order - b.order;
	if (a.definitionIndex !== undefined && b.definitionIndex !== undefined) {
		return a.definitionIndex - b.definitionIndex;
	}
	if (a.definitionIndex !== undefined) return -1;
	if (b.definitionIndex !== undefined) return 1;
	return a.id.localeCompare(b.id);
};

const sortToolbars = (toolbars: ToolbarRegistration[]) =>
	[...toolbars].sort(compareToolbars);

const toolbarGroupsEqual = (
	a: ToolbarRegistration["groups"],
	b: ToolbarRegistration["groups"],
) =>
	a.length === b.length &&
	a.every(
		(group, groupIndex) =>
			group.length === b[groupIndex]?.length &&
			group.every((item, itemIndex) => item === b[groupIndex][itemIndex]),
	);

const toolbarsEqual = (a: ToolbarRegistration, b: ToolbarRegistration) =>
	a.id === b.id &&
	a.source === b.source &&
	a.viewportId === b.viewportId &&
	a.side === b.side &&
	a.align === b.align &&
	a.order === b.order &&
	a.definitionIndex === b.definitionIndex &&
	a.visibility === b.visibility &&
	a.ariaLabel === b.ariaLabel &&
	a.defaultIcon === b.defaultIcon &&
	toolbarGroupsEqual(a.groups, b.groups);

const upsertToolbar = (
	toolbars: ToolbarRegistration[],
	nextToolbar: ToolbarRegistration,
): ToolbarRegistration[] => {
	const existing = toolbars.find((toolbar) => toolbar.id === nextToolbar.id);
	if (existing && toolbarsEqual(existing, nextToolbar)) {
		return toolbars;
	}

	return [
		...toolbars.filter((toolbar) => toolbar.id !== nextToolbar.id),
		nextToolbar,
	];
};

const ensureGroup = (
	toolbar: ToolbarRegistration,
	groupIndex: number,
): ToolbarRegistration => {
	if (toolbar.groups[groupIndex]) {
		return toolbar;
	}

	const groups = [...toolbar.groups];
	while (groups.length <= groupIndex) {
		groups.push([]);
	}

	return {
		...toolbar,
		groups,
	};
};

const addItemsToToolbar = (
	toolbar: ToolbarRegistration,
	groupIndex: number,
	items: ToolbarRuntimeTokenEntry["items"],
): ToolbarRegistration => {
	const nextToolbar = ensureGroup(toolbar, groupIndex);

	return {
		...nextToolbar,
		groups: nextToolbar.groups.map((group, index) =>
			index === groupIndex ? [...group, ...items] : group,
		),
	};
};

const removeItemOccurrences = <T>(items: T[], itemsToRemove: T[]) => {
	const remainingToRemove = [...itemsToRemove];

	return items.filter((item) => {
		const index = remainingToRemove.findIndex(
			(candidate) => candidate === item,
		);
		if (index === -1) return true;

		remainingToRemove.splice(index, 1);
		return false;
	});
};

const removeItemsFromToolbar = (
	toolbar: ToolbarRegistration,
	tokenEntry: ToolbarRuntimeTokenEntry,
): ToolbarRegistration | undefined => {
	const nextGroups = toolbar.groups.map((group, index) =>
		index === tokenEntry.groupIndex
			? removeItemOccurrences(group, tokenEntry.items)
			: group,
	);

	if (nextGroups.every((group) => group.length === 0)) {
		return undefined;
	}

	return {
		...toolbar,
		groups: nextGroups,
	};
};

const createRuntimeTokenEntry = (
	toolbarId: string,
	groupIndex: number,
	items: ToolbarRuntimeTokenEntry["items"],
): ToolbarRuntimeTokenEntry => ({
	toolbarId,
	groupIndex,
	items,
});

const findRuntimeToolbar = (
	runtimeToolbars: ToolbarRegistration[],
	target: ToolbarRuntimeTarget,
): ToolbarRegistration | undefined => {
	if (target.toolbarId) {
		return runtimeToolbars.find(
			(toolbar) => toolbar.id === target.toolbarId,
		);
	}

	return sortToolbars(
		runtimeToolbars.filter(
			(toolbar) =>
				toolbar.side === target.fallbackSide &&
				toolbar.align === target.fallbackAlign,
		),
	)[0];
};

const buildRuntimeToolbar = (
	existing: ToolbarRegistration | undefined,
	target: ToolbarRuntimeTarget,
	items: ToolbarRuntimeTokenEntry["items"],
): {toolbar: ToolbarRegistration; groupIndex: number} => {
	const groupIndex = target.groupIndex ?? DEFAULT_RUNTIME_GROUP_INDEX;
	const toolbarId =
		existing?.id ??
		target.toolbarId ??
		`${target.fallbackSide}-${target.fallbackAlign}-runtime`;

	return {
		groupIndex,
		toolbar: addItemsToToolbar(
			normalizeToolbar({
				...existing,
				id: toolbarId,
				source: "runtime",
				side: existing?.side ?? target.fallbackSide,
				align: existing?.align ?? target.fallbackAlign,
				order: existing?.order ?? target.order ?? 0,
				groups: existing?.groups ?? [],
			}),
			groupIndex,
			items,
		),
	};
};

const addRuntimeToolbarControls = (
	state: ToolbarStoreState,
	target: ToolbarRuntimeTarget,
	items: ToolbarRuntimeTokenEntry["items"],
):
	| {
			token: string;
			nextState: Pick<
				ToolbarStoreState,
				"runtimeToolbars" | "runtimeTokens"
			>;
	  }
	| undefined => {
	const existing = findRuntimeToolbar(state.runtimeToolbars, target);
	if (!existing && target.createIfMissing === false) {
		return undefined;
	}

	const token = generateToken();
	const {toolbar, groupIndex} = buildRuntimeToolbar(existing, target, items);

	return {
		token,
		nextState: {
			runtimeToolbars: upsertToolbar(state.runtimeToolbars, toolbar),
			runtimeTokens: {
				...state.runtimeTokens,
				[token]: createRuntimeTokenEntry(toolbar.id, groupIndex, items),
			},
		},
	};
};

const removeRuntimeToolbarToken = (
	state: ToolbarStoreState,
	token: string,
):
	| {
			nextState: Pick<
				ToolbarStoreState,
				"runtimeToolbars" | "runtimeTokens"
			>;
	  }
	| undefined => {
	const tokenEntry = state.runtimeTokens[token];
	if (!tokenEntry) {
		return undefined;
	}

	const nextRuntimeTokens = {...state.runtimeTokens};
	delete nextRuntimeTokens[token];

	return {
		nextState: {
			runtimeTokens: nextRuntimeTokens,
			runtimeToolbars: state.runtimeToolbars
				.map((toolbar) =>
					toolbar.id === tokenEntry.toolbarId
						? removeItemsFromToolbar(toolbar, tokenEntry)
						: toolbar,
				)
				.filter((toolbar): toolbar is ToolbarRegistration => !!toolbar),
		},
	};
};

const selectMergedToolbars = (
	state: ToolbarStoreState,
	viewportId?: string,
): ToolbarRegistration[] => {
	const visibleToolbars = [
		...state.definitionToolbars,
		...state.defaultToolbars,
		...state.runtimeToolbars,
	];

	return sortToolbars(
		visibleToolbars.filter((toolbar) =>
			toolbarMatchesViewport(toolbar, viewportId),
		),
	);
};

export const useShapeDiverStoreToolbars = create<IShapeDiverStoreToolbars>()(
	devtools(
		(set, get) => ({
			definitionToolbars: [],
			defaultToolbars: [],
			runtimeToolbars: [],
			runtimeTokens: {},

			setDefinitionToolbars: (toolbars) =>
				set(
					{definitionToolbars: normalizeDefinitionToolbars(toolbars)},
					false,
					"setDefinitionToolbars",
				),

			resetDefinitionToolbars: () =>
				set(
					{
						definitionToolbars: [],
					},
					false,
					"resetDefinitionToolbars",
				),

			setDefaultToolbar: (toolbar) =>
				set(
					(state) => {
						const defaultToolbars = upsertToolbar(
							state.defaultToolbars,
							normalizeToolbar({...toolbar, source: "default"}),
						);

						return defaultToolbars === state.defaultToolbars
							? state
							: {defaultToolbars};
					},
					false,
					"setDefaultToolbar",
				),

			removeDefaultToolbar: (toolbarId) =>
				set(
					(state) => {
						if (
							!state.defaultToolbars.some(
								(toolbar) => toolbar.id === toolbarId,
							)
						) {
							return state;
						}

						return {
							defaultToolbars: state.defaultToolbars.filter(
								(toolbar) => toolbar.id !== toolbarId,
							),
						};
					},
					false,
					`removeDefaultToolbar-${toolbarId}`,
				),

			addRuntimeToolbarControls: (target, items) => {
				const result = addRuntimeToolbarControls(get(), target, items);
				if (!result) {
					return undefined;
				}

				set(
					result.nextState,
					false,
					`addRuntimeToolbarControls-${result.nextState.runtimeTokens[result.token].toolbarId}-${result.token}`,
				);

				return result.token;
			},

			removeRuntimeToolbarToken: (token) => {
				const result = removeRuntimeToolbarToken(get(), token);
				if (!result) {
					return false;
				}

				set(
					result.nextState,
					false,
					`removeRuntimeToolbarToken-${token}`,
				);
				return true;
			},

			selectMergedToolbars: (viewportId) =>
				selectMergedToolbars(get(), viewportId),
		}),
		{...devtoolsSettings, name: "ShapeDiver | Toolbars"},
	),
);
