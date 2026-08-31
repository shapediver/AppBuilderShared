import {useEffect, useRef} from "react";
import {parseSelectionNames} from "./parseSelectionNames";

interface UseCommittedSelectionAdoptionOptions {
	/** The committed value of the selection parameter (state.uiValue). */
	committedValue: string | undefined;
	selectedNodeNames: string[];
	setSelectedNodeNames: (names: string[]) => void;
	/** Called before a draft is replaced by an externally committed value. */
	onAdopt?: () => void;
}

/**
 * Adopts committed value changes that did not originate from the selection
 * component itself, e.g. a dynamic (custom) parameter whose value is changed
 * by the model (Grasshopper) as part of a computation, a history restore, or a
 * reject of pending changes.
 *
 * Such a change replaces the current draft. Otherwise the stale draft would be
 * treated as pending, be submitted again with the next update, and override
 * the value set by the model. Changes originating from the component already
 * match the selected node names and are a no-op. A draft is retained as long
 * as the committed value itself does not change (e.g. when another parameter
 * triggers a computation).
 */
export const useCommittedSelectionAdoption = ({
	committedValue,
	selectedNodeNames,
	setSelectedNodeNames,
	onAdopt,
}: UseCommittedSelectionAdoptionOptions) => {
	const lastCommittedValueRef = useRef(committedValue);

	useEffect(() => {
		if (lastCommittedValueRef.current === committedValue) return;
		lastCommittedValueRef.current = committedValue;
		const committed = parseSelectionNames(committedValue);
		if (JSON.stringify(committed) === JSON.stringify(selectedNodeNames))
			return;
		onAdopt?.();
		setSelectedNodeNames(committed);
	}, [committedValue, onAdopt, selectedNodeNames, setSelectedNodeNames]);
};
