import type {NamedNode} from "@AppBuilderLib/entities/parameter/config/namedNode";
import {resolveSelectionActionChange} from "@AppBuilderLib/entities/parameter/lib/selectionAction";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useShapeDiverStoreParameters} from "../useShapeDiverStoreParameters";

/**
 * Mounted selection the "selection" action can change.
 *
 * The selection lives in React state of the mounted parameter, or of a root
 * interaction slot group, not in a store. The component registers while it
 * is mounted. `parameter` is set for an interaction parameter. Without it,
 * the entry is a root `selecton` / `selectoff` group.
 *
 * This module must stay free of viewer imports: the action catalog imports
 * it. Name matching is installed from the UI, which already loads the viewer.
 */
type SelectionActionTarget = {
	ownerKey: string;
	/** Namespace of the App Builder root, or of the interaction parameter. */
	namespace: string;
	parameter?: {namespace: string; id: string; name: string};
	/** Candidates in scene order. */
	getCandidates: () => readonly NamedNode[];
	getSelectedNames: () => readonly string[];
	getMaximumSelection: () => number;
	/**
	 * A deselection which would drop a non-empty selection below this number
	 * is refused, the same as a click. 0 when a click may clear the selection.
	 */
	getMinimumSelection: () => number;
	setSelectedNames: (names: string[]) => void;
	/**
	 * Name filter of the selection group. When it is non-empty, the nodes it
	 * matches in the live scene are the candidates. The React candidate list
	 * lags a computation: the node a `computationend` action selects is
	 * already in the scene and not in that list yet.
	 */
	getNameFilter?: () => readonly string[];
};

export type SelectionActionRequest = {
	select?: string[];
	deselect?: string[];
	parameter?: {name: string; sessionId?: string};
};

export type SelectionActionContext = {
	/** Namespace of the parameter if the request has no `sessionId`. */
	namespace: string;
	/** Throw if the requested parameter does not exist. */
	strict?: boolean;
};

const targets = new Map<string, SelectionActionTarget>();

/**
 * How many selection actions are on the stack. The outermost action runs
 * `selecton` / `selectoff`. One started while those slots are being
 * delivered still changes the selection, and does not run the slots again.
 */
let selectionActionDepth = 0;

/** How many `selecton` / `selectoff` deliveries are on the stack. */
let selectionSlotDispatchDepth = 0;

/** Whether this selection change should run `selecton` / `selectoff`. */
export function shouldEmitSelectionActionSlots(): boolean {
	return selectionActionDepth <= 1 && selectionSlotDispatchDepth === 0;
}

/**
 * Deliver selection slots. An action they start does not deliver them
 * again. The guard ends when this call returns, so a later action does run
 * the slots.
 */
export function runSelectionSlotDispatch(run: () => void): void {
	selectionSlotDispatchDepth++;
	try {
		run();
	} finally {
		selectionSlotDispatchDepth--;
	}
}

type NameFinder = (nameFilter: readonly string[]) => readonly string[];

let findMatchingNames: NameFinder = () => [];

/**
 * Install the scene lookup used to match `select` / `deselect`.
 * `useSelectionActionTarget` installs `findNamedNodesByNameFilter`.
 */
export const setSelectionActionNameFinder = (finder: NameFinder) => {
	findMatchingNames = finder;
};

/**
 * Register a target. A later registration with the same key replaces the
 * earlier one (e.g. a remount). Returns the function to unregister.
 */
export const registerSelectionActionTarget = (
	target: SelectionActionTarget,
): (() => void) => {
	targets.set(target.ownerKey, target);

	return () => {
		if (targets.get(target.ownerKey) === target)
			targets.delete(target.ownerKey);
	};
};

/** Test-only: drop all registered targets. */
export const resetSelectionActionTargets = () => {
	targets.clear();
	selectionActionDepth = 0;
	selectionSlotDispatchDepth = 0;
};

const uniqueNames = (names: readonly string[]): string[] => {
	const seen = new Set<string>();
	const unique: string[] = [];
	for (const name of names) {
		if (seen.has(name)) continue;
		seen.add(name);
		unique.push(name);
	}

	return unique;
};

/**
 * Nodes the action may change. A name filter is matched against the live
 * scene. Without one, the React candidate list is the scene the group knows.
 */
const namesAllowedByTarget = (target: SelectionActionTarget): string[] => {
	const filter = target.getNameFilter?.() ?? [];
	if (filter.length > 0) return uniqueNames(findMatchingNames(filter));

	return uniqueNames(target.getCandidates().map(({name}) => name));
};

const matchingNames = (
	allowed: readonly string[],
	patterns: readonly string[],
): string[] => {
	if (patterns.length === 0 || allowed.length === 0) return [];
	const matched = new Set(findMatchingNames(patterns));
	const names: string[] = [];
	const seen = new Set<string>();
	for (const name of allowed) {
		if (!matched.has(name) || seen.has(name)) continue;
		seen.add(name);
		names.push(name);
	}

	return names;
};

const resolveRequestedParameter = (
	parameter: NonNullable<SelectionActionRequest["parameter"]>,
	context: SelectionActionContext,
) => {
	const namespace = parameter.sessionId ?? context.namespace;
	const store = useShapeDiverStoreParameters
		.getState()
		.getParameter(namespace, parameter.name);

	return store
		? {namespace, parameterId: store.getState().definition.id}
		: undefined;
};

/**
 * Run a "selection" action.
 *
 * Without `parameter`, root interaction slot groups of this App Builder
 * whose candidates match change. Groups of another mounted root are left
 * alone. With `parameter`, only that mounted interaction parameter changes.
 * A node targeted by both lists is selected. A result equal to the current
 * selection is not applied. A deselect that would drop a non-empty selection
 * below the minimum a click keeps is not applied.
 *
 * @returns The ids of the parameters (or the owner keys of the root groups)
 * whose selection was changed.
 */
export function applySelectionAction(
	request: SelectionActionRequest,
	context: SelectionActionContext,
): string[] {
	const select = request.select ?? [];
	const deselect = request.deselect ?? [];
	if (select.length === 0 && deselect.length === 0) return [];

	selectionActionDepth += 1;
	try {
		return applySelectionActionOnce(request, context, select, deselect);
	} finally {
		selectionActionDepth -= 1;
	}
}

function applySelectionActionOnce(
	request: SelectionActionRequest,
	context: SelectionActionContext,
	select: string[],
	deselect: string[],
): string[] {
	let candidates = Array.from(targets.values()).filter((target) =>
		request.parameter
			? target.parameter !== undefined
			: target.parameter === undefined &&
				target.namespace === context.namespace,
	);
	if (request.parameter) {
		const requested = resolveRequestedParameter(request.parameter, context);
		if (!requested) {
			const message = `Parameter "${request.parameter.name}" not found.`;
			if (context.strict) throw new Error(message);
			Logger.warn(`Selection action: ${message}`);

			return [];
		}
		candidates = candidates.filter(
			(target) =>
				target.parameter?.namespace === requested.namespace &&
				target.parameter.id === requested.parameterId,
		);
		if (candidates.length === 0) {
			Logger.warn(
				`Selection action: Parameter "${request.parameter.name}" has no selection which can be changed.`,
			);

			return [];
		}
	}

	const changed: string[] = [];
	for (const target of candidates) {
		const allowed = namesAllowedByTarget(target);
		const selectedNames = target.getSelectedNames();
		const maximumSelection = target.getMaximumSelection();
		const result = resolveSelectionActionChange(
			allowed,
			selectedNames,
			new Set(matchingNames(allowed, select)),
			new Set(matchingNames(allowed, deselect)),
			maximumSelection,
			target.getMinimumSelection(),
		);
		if (result.exceededBy > 0) {
			const where = target.parameter
				? `parameter "${target.parameter.name}"`
				: "the root selection";
			Logger.warn(
				`Selection action: ${result.exceededBy} more node(s) match than the maximum selection of ${maximumSelection} allows for ${where}. The first matches in scene order are selected.`,
			);
		}
		if (!result.changed) continue;
		target.setSelectedNames(result.names);
		changed.push(target.parameter?.id ?? target.ownerKey);
	}

	return changed;
}
