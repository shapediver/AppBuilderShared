import {resolveSelectionActionChange} from "@AppBuilderLib/entities/parameter/lib/selectionAction";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useShapeDiverStoreParameters} from "../useShapeDiverStoreParameters";

/**
 * A mounted interaction parameter with a selection (selection, gumball,
 * rectangle transform) which the "selection" action can change.
 *
 * The parameter registers itself, see `useSelectionActionTarget`. The action
 * changes the selection of the component, which then behaves as if the user
 * had made that selection.
 *
 * This module must stay free of viewer imports: the action catalog imports it.
 */
export type SelectionActionTarget = {
	/** Unique key of the mounted component. */
	ownerKey: string;
	namespace: string;
	parameterId: string;
	parameterName: string;
	/** The names of the candidate nodes of the parameter, in scene order. */
	getCandidateNames: () => string[];
	/**
	 * The names of the candidate nodes which are matched by name filters
	 * (see `matchSelectionNames`).
	 */
	matchNames: (nameFilter: string[]) => Set<string>;
	getSelectedNames: () => string[];
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
export const resetSelectionActionTargets = () => targets.clear();

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
 * Run a "selection" action: select and deselect nodes of the registered
 * interaction parameters. A node targeted by both lists is selected.
 *
 * @returns The ids of the parameters whose selection was changed.
 */
export function applySelectionAction(
	request: SelectionActionRequest,
	context: SelectionActionContext,
): string[] {
	const select = request.select ?? [];
	const deselect = request.deselect ?? [];
	if (select.length === 0 && deselect.length === 0) return [];

	let candidates = Array.from(targets.values());
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
				target.namespace === requested.namespace &&
				target.parameterId === requested.parameterId,
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
		const maximumSelection = target.getMaximumSelection();
		const result = resolveSelectionActionChange({
			candidateNames: target.getCandidateNames(),
			selectedNames: target.getSelectedNames(),
			selectMatches: target.matchNames(select),
			deselectMatches: target.matchNames(deselect),
			maximumSelection,
		});
		if (result.exceededBy > 0) {
			Logger.warn(
				`Selection action: ${result.exceededBy} more node(s) match than the maximum selection of ${maximumSelection} allows for parameter "${target.parameterName}". The first matches in scene order are selected.`,
			);
		}
		if (!result.changed) continue;
		target.setSelectedNames(result.names);
		changed.push(target.parameterId);
	}

	return changed;
}
