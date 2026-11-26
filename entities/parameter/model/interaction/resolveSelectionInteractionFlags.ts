import {selectionAllowsSelect} from "./selectionAllowsSelect";

/**
 * Resolve the node interaction `select` / `hover` flags for a selection
 * group. A maximum below 1 does not select; hover still follows `hover`.
 */
export const resolveSelectionInteractionFlags = ({
	maximumSelection,
	hover,
	singleCandidateSuppressed = false,
}: {
	maximumSelection?: number;
	hover?: boolean;
	singleCandidateSuppressed?: boolean;
}): {select: boolean; hover: boolean} => ({
	select:
		!singleCandidateSuppressed && selectionAllowsSelect(maximumSelection),
	hover: !singleCandidateSuppressed && !!hover,
});
