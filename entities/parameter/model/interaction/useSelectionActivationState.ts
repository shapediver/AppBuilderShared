import {useCallback, useState} from "react";

interface UseSelectionActivationStateOptions {
	alwaysActive: boolean;
	automaticallyActivated: boolean;
}

/** Owns selection activation and suspension state, independent of its UI. */
export const useSelectionActivationState = ({
	alwaysActive,
	automaticallyActivated,
}: UseSelectionActivationStateOptions) => {
	const [selectionActive, setSelectionActive] = useState(automaticallyActivated);
	const [suspended, setSuspended] = useState(false);
	const [ownershipBlocked, setOwnershipBlocked] = useState(automaticallyActivated);

	const effectiveSelectionActive =
		!suspended && !ownershipBlocked && (alwaysActive || selectionActive);
	const selectionRegistered =
		!ownershipBlocked && (alwaysActive || selectionActive);
	const deactivateSelection = useCallback(() => {
		if (!alwaysActive) setSelectionActive(false);
	}, [alwaysActive]);

	return {
		deactivateSelection,
		effectiveSelectionActive,
		selectionRegistered,
		setOwnershipBlocked,
		setSelectionActive,
		setSuspended,
		suspended,
	};
};
