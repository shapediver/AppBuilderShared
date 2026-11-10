import {
	findNamedNodesByNameFilter,
	type NamedNode,
} from "@AppBuilderLib/entities/parameter/lib/findNodesByNameFilter";
import {useEffect, useRef} from "react";
import {
	registerSelectionActionTarget,
	setSelectionActionNameFinder,
} from "./selectionActionRegistry";

// The registry stays free of the viewer. This module already runs in the
// mounted parameter and the root slot group, which load the viewer.
setSelectionActionNameFinder((nameFilter) => {
	if (nameFilter.length === 0) return [];

	return findNamedNodesByNameFilter([...nameFilter], true).map(
		({name}) => name,
	);
});

export type UseSelectionActionTargetProps = {
	/** Unique key of the mounted component. */
	ownerKey: string;
	/** Candidates in scene order. */
	candidateNodes: readonly NamedNode[];
	selectedNodeNames: readonly string[];
	/**
	 * Current names, including a change made earlier in this event. Falls
	 * back to `selectedNodeNames` when omitted.
	 */
	getSelectedNames?: () => readonly string[];
	/** `Infinity` if unlimited. */
	maximumSelection: number;
	/**
	 * A deselection which would drop a non-empty selection below this number
	 * is refused, the same as a click. Omitted is `0`.
	 */
	minimumSelection?: number;
	/**
	 * Name filter of this selection group. A non-empty filter is matched
	 * against the live scene, so a node created by the computation that just
	 * ended can be selected before React's candidate list includes it.
	 */
	nameFilter?: readonly string[];
	setSelectedNames: (names: string[]) => void;
	/**
	 * Namespace of a root interaction slot group. An interaction parameter
	 * passes its namespace on `parameter` instead.
	 */
	namespace?: string;
	/**
	 * Set for a mounted interaction parameter (selection, gumball, rectangle
	 * transform). Root interaction slot groups omit it: they are the targets
	 * of a selection action that does not name a parameter.
	 */
	parameter?: {namespace: string; id: string; name: string};
	/**
	 * Whether the action can change the selection, e.g. not while another
	 * interaction owns the nodes. Omitted is `true`.
	 */
	enabled?: boolean;
};

/**
 * Makes a mounted selection available to the "selection" action.
 *
 * The action sets the selected names of this component. A parameter then
 * applies its own rules (confirmation, maximum). A root slot group updates
 * its scene selection and runs `selecton` / `selectoff`.
 */
export function useSelectionActionTarget(props: UseSelectionActionTargetProps) {
	const propsRef = useRef(props);
	propsRef.current = props;

	const {ownerKey, parameter, enabled = true} = props;
	const namespace = parameter?.namespace ?? props.namespace ?? "";
	const parameterId = parameter?.id;
	const parameterName = parameter?.name;

	useEffect(
		() =>
			enabled
				? registerSelectionActionTarget({
						ownerKey,
						namespace,
						parameter:
							namespace !== undefined &&
							parameterId !== undefined &&
							parameterName !== undefined
								? {
										namespace,
										id: parameterId,
										name: parameterName,
									}
								: undefined,
						getCandidates: () => propsRef.current.candidateNodes,
						getSelectedNames: () =>
							propsRef.current.getSelectedNames?.() ??
							propsRef.current.selectedNodeNames,
						getMaximumSelection: () =>
							propsRef.current.maximumSelection,
						getMinimumSelection: () =>
							propsRef.current.minimumSelection ?? 0,
						getNameFilter: () => propsRef.current.nameFilter ?? [],
						setSelectedNames: (names) => {
							// Actions in a row see this selection before the next render.
							propsRef.current = {
								...propsRef.current,
								selectedNodeNames: names,
							};
							propsRef.current.setSelectedNames(names);
						},
					})
				: undefined,
		[ownerKey, namespace, parameterId, parameterName, enabled],
	);
}
