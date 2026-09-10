import {useEffect, useRef} from "react";
import {parseSelectionNames} from "./parseSelectionNames";

interface UseCommittedSelectionAdoptionOptions {
	/**
	 * The committed value of the selection parameter (state.commitValue).
	 * Pass undefined to disable the adoption, e.g. for parameters which are
	 * not backed by the parameter store.
	 */
	committedValue: string | undefined;
	/**
	 * The revision of the committed value (state.commitRevision). A change of
	 * the revision means that the parameter was committed (executed), even if
	 * the committed value itself did not change.
	 */
	commitRevision?: number;
	selectedNodeNames: string[];
	setSelectedNodeNames: (names: string[]) => void;
	/** Called before a draft is replaced by the committed value. */
	onAdopt?: () => void;
}

/**
 * Adopts the committed value of a selection parameter into the selection
 * whenever the parameter is committed: by an execution of this component, by
 * an external execution (history, agent, ...), by a value defined by the model,
 * or by a reject of pending changes.
 *
 * Such a commit replaces the current draft. Otherwise a stale draft would be
 * treated as pending, be submitted again with the next update, and override
 * the committed value. This also covers commits which do not change the
 * committed value, e.g. a parameter which is reset to the same value after each
 * execution (see the "resetValue" setting), by observing the commit revision.
 * A draft is retained as long as the parameter is not committed (e.g. when
 * another parameter triggers a computation).
 */
export const useCommittedSelectionAdoption = ({
	committedValue,
	commitRevision,
	selectedNodeNames,
	setSelectedNodeNames,
	onAdopt,
}: UseCommittedSelectionAdoptionOptions) => {
	const lastCommittedValueRef = useRef(committedValue);
	const lastCommitRevisionRef = useRef(commitRevision);

	useEffect(() => {
		if (
			lastCommittedValueRef.current === committedValue &&
			lastCommitRevisionRef.current === commitRevision
		)
			return;
		lastCommittedValueRef.current = committedValue;
		lastCommitRevisionRef.current = commitRevision;
		if (committedValue === undefined) return;
		const committed = parseSelectionNames(committedValue);
		if (JSON.stringify(committed) === JSON.stringify(selectedNodeNames))
			return;
		onAdopt?.();
		setSelectedNodeNames(committed);
	}, [
		commitRevision,
		committedValue,
		onAdopt,
		selectedNodeNames,
		setSelectedNodeNames,
	]);
};
