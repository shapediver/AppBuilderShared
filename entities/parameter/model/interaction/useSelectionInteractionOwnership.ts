import {useCallback, useEffect, useMemo, useRef} from "react";
import {interactionOwnership} from "./interactionOwnership";
import {useInteractionRequestLifecycle} from "./useInteractionRequestLifecycle";

type CandidateNode = {nodeId: string; name: string};

interface UseSelectionInteractionOwnershipOptions {
	viewportId: string;
	namespace: string;
	parameterId: string;
	label: string;
	candidateNodes: CandidateNode[];
	alwaysActive: boolean;
	automaticallyActivated: boolean;
	selectionRegistered: boolean;
	effectiveSelectionActive: boolean;
	setSelectionActive: (active: boolean) => void;
	setOwnershipBlocked: (blocked: boolean) => void;
	setSuspended: (suspended: boolean) => void;
	cancel: () => void;
	restoreSelection: () => void;
	setDisableOtherParameters: (disabled: boolean) => void;
	onConflict: (title: string, message: string) => void;
}

/** Owns selection's persistent interaction and candidate-claim lifecycle. */
export const useSelectionInteractionOwnership = ({
	viewportId,
	namespace,
	parameterId,
	label,
	candidateNodes,
	alwaysActive,
	automaticallyActivated,
	selectionRegistered,
	effectiveSelectionActive,
	setSelectionActive,
	setOwnershipBlocked,
	setSuspended,
	cancel,
	restoreSelection,
	setDisableOtherParameters,
	onConflict,
}: UseSelectionInteractionOwnershipOptions) => {
	const ownershipKey = `${namespace}-${parameterId}-${viewportId}`;
	const ownershipKeyRef = useRef(ownershipKey);
	const claimedRef = useRef(false);
	const deactivateRef = useRef<() => void>();
	const lastAutomaticCandidateSignatureRef = useRef<string>();

	useEffect(() => {
		ownershipKeyRef.current = ownershipKey;
	}, [ownershipKey]);

	const deactivate = useCallback(() => {
		interactionOwnership.release(viewportId, ownershipKey);
		claimedRef.current = false;
		setOwnershipBlocked(true);
		setSelectionActive(false);
	}, [ownershipKey, setOwnershipBlocked, setSelectionActive, viewportId]);

	useEffect(() => {
		deactivateRef.current = deactivate;
	}, [deactivate]);

	const tryAcquireClaim = useCallback(
		(userRequested: boolean): boolean => {
			if (candidateNodes.length === 0) return false;
			const result = interactionOwnership.acquire(
				viewportId,
				ownershipKey,
				label,
				"selection",
				alwaysActive,
				candidateNodes,
				() => deactivateRef.current?.(),
				userRequested,
			);
			if (result.acquired) {
				claimedRef.current = true;
				setOwnershipBlocked(false);
				return true;
			}
			onConflict(
				"Selection unavailable",
				`${label} shares selectable nodes with ${result.conflictingOwners.join(", ")}.`,
			);
			return false;
		},
		[
			alwaysActive,
			candidateNodes,
			label,
			onConflict,
			ownershipKey,
			setOwnershipBlocked,
			viewportId,
		],
	);

	const suspend = useCallback(() => {
		setSuspended(true);
		restoreSelection();
	}, [restoreSelection, setSuspended]);
	const resume = useCallback(() => setSuspended(false), [setSuspended]);

	useInteractionRequestLifecycle({
		viewportId,
		active: selectionRegistered,
		persistent: alwaysActive,
		onDisable: cancel,
		onSuspend: suspend,
		onResume: resume,
		setDisableOtherParameters,
	});

	const candidateSignature = useMemo(
		() =>
			candidateNodes
				.map(({nodeId}) => nodeId)
				.sort()
				.join(","),
		[candidateNodes],
	);

	useEffect(() => {
		if (!automaticallyActivated || candidateNodes.length === 0) return;
		if (lastAutomaticCandidateSignatureRef.current === candidateSignature)
			return;
		lastAutomaticCandidateSignatureRef.current = candidateSignature;

		const result = interactionOwnership.acquire(
			viewportId,
			ownershipKey,
			label,
			"selection",
			alwaysActive,
			candidateNodes,
			() => deactivateRef.current?.(),
			false,
		);
		if (result.acquired) {
			claimedRef.current = true;
			setOwnershipBlocked(false);
			return;
		}
		claimedRef.current = false;
		setOwnershipBlocked(true);
		onConflict(
			"Selection unavailable",
			`${label} shares selectable nodes with ${result.conflictingOwners.join(", ")}.`,
		);
	}, [
		automaticallyActivated,
		alwaysActive,
		candidateNodes,
		candidateSignature,
		label,
		onConflict,
		ownershipKey,
		setOwnershipBlocked,
		viewportId,
	]);

	useEffect(() => {
		if (effectiveSelectionActive && claimedRef.current) {
			const result = interactionOwnership.update(
				viewportId,
				ownershipKey,
				candidateNodes,
			);
			if (!result.updated) {
				claimedRef.current = false;
				setOwnershipBlocked(true);
				onConflict(
					"Selection deactivated",
					`${label} now shares selectable nodes with ${result.conflictingOwners.join(", ")}.`,
				);
			}
		} else if (!effectiveSelectionActive && claimedRef.current) {
			interactionOwnership.release(viewportId, ownershipKey);
			claimedRef.current = false;
		}
	}, [
		candidateNodes,
		effectiveSelectionActive,
		label,
		onConflict,
		ownershipKey,
		setOwnershipBlocked,
		viewportId,
	]);

	useEffect(
		() => () => {
			if (claimedRef.current) {
				interactionOwnership.release(
					viewportId,
					ownershipKeyRef.current,
				);
				claimedRef.current = false;
			}
		},
		[viewportId],
	);

	return {tryAcquireClaim};
};
