import type {NamedNode} from "@AppBuilderLib/entities/parameter/lib/findNodesByNameFilter";
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
	setSelectedNames: (names: string[]) => void;
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
 * `selecton` / `selectoff`. A selection action started by those slots still
 * changes the selection, and does not run the slots again. Two slots that
 * select different nodes would otherwise call each other until the page stops.
 */
let selectionActionDepth = 0;

/**
 * `selecton` / `selectoff` handlers still running, per selection group.
 * A sequential `executeActions` awaits between steps, so the depth above is
 * already 0 when a later step selects again. Only that group's slots stay
 * quiet. Another App Builder, or another group in the same one, still runs.
 */
const selectionSlotChains = new Map<string, number>();

/** Whether this group's selection change should run its slots. */
export function shouldEmitSelectionActionSlots(ownerKey: string): boolean {
	return (
		selectionActionDepth <= 1 &&
		(selectionSlotChains.get(ownerKey) ?? 0) === 0
	);
}

/** A selection slot handler started. Pair with {@link leaveSelectionSlotChain}. */
export function enterSelectionSlotChain(ownerKey: string): void {
	selectionSlotChains.set(
		ownerKey,
		(selectionSlotChains.get(ownerKey) ?? 0) + 1,
	);
}

/** The selection slot handler settled, including its awaited actions. */
export function leaveSelectionSlotChain(ownerKey: string): void {
	const next = (selectionSlotChains.get(ownerKey) ?? 0) - 1;
	if (next <= 0) selectionSlotChains.delete(ownerKey);
	else selectionSlotChains.set(ownerKey, next);
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
	selectionSlotChains.clear();
};

const matchingCandidateNames = (
	candidates: readonly NamedNode[],
	nameFilter: readonly string[],
): string[] => {
	if (nameFilter.length === 0 || candidates.length === 0) return [];
	const matched = new Set(findMatchingNames(nameFilter));
	const names: string[] = [];
	const seen = new Set<string>();
	for (const candidate of candidates) {
		if (!matched.has(candidate.name) || seen.has(candidate.name)) continue;
		seen.add(candidate.name);
		names.push(candidate.name);
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
 * selection is not applied.
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
		const candidateNodes = target.getCandidates();
		const selectedNames = target.getSelectedNames();
		const maximumSelection = target.getMaximumSelection();
		const result = resolveSelectionActionChange(
			candidateNodes.map(({name}) => name),
			selectedNames,
			new Set(matchingCandidateNames(candidateNodes, select)),
			new Set(matchingCandidateNames(candidateNodes, deselect)),
			maximumSelection,
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
