import type {ITreeNode} from "@shapediver/viewer.session";
import {useEffect, useRef} from "react";
import {registerSelectionActionTarget} from "./selectionActionRegistry";
import {matchSelectionNames} from "./selectionNameMatcher";

export type UseSelectionActionTargetProps = {
	/** Unique key of the mounted component. */
	ownerKey: string;
	namespace: string;
	parameterId: string;
	parameterName: string;
	/** All candidate nodes of the parameter, in scene order. */
	candidateNodes: {name: string; node: ITreeNode}[];
	selectedNodeNames: string[];
	/** The `maximumSelection` of the parameter, `Infinity` if unlimited. */
	maximumSelection: number;
	setSelectedNodeNames: (names: string[]) => void;
};

/**
 * Makes the selection of an interaction parameter (selection, gumball,
 * rectangle transform) available to the "selection" action.
 *
 * The action sets the selected node names of the component, exactly like a
 * selection in the viewport does: the component applies its own rules, e.g.
 * confirms the selection automatically or waits for the confirmation.
 */
export function useSelectionActionTarget(props: UseSelectionActionTargetProps) {
	const propsRef = useRef(props);
	propsRef.current = props;

	const {ownerKey, namespace, parameterId, parameterName} = props;
	useEffect(
		() =>
			registerSelectionActionTarget({
				ownerKey,
				namespace,
				parameterId,
				parameterName,
				getCandidateNames: () =>
					propsRef.current.candidateNodes.map(({name}) => name),
				matchNames: (nameFilter) =>
					matchSelectionNames(
						nameFilter,
						propsRef.current.candidateNodes.map(({node}) => node),
					),
				getSelectedNames: () => propsRef.current.selectedNodeNames,
				getMaximumSelection: () => propsRef.current.maximumSelection,
				setSelectedNames: (names) => {
					// Actions in a row see this selection before the next render.
					propsRef.current = {
						...propsRef.current,
						selectedNodeNames: names,
					};
					propsRef.current.setSelectedNodeNames(names);
				},
			}),
		[ownerKey, namespace, parameterId, parameterName],
	);
}
