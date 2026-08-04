import {useCallback, useEffect, useMemo, useRef, useState} from "react";
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
	onDisable: () => void;
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
	onDisable,
	setDisableOtherParameters,
	onConflict,
}: UseSelectionInteractionOwnershipOptions) => {
	const ownershipKey = `${namespace}-${parameterId}-${viewportId}`;
	// Persistent selections remain suspendable and can be reactivated manually,
	// so their node claim must remain user-displaceable.
	const ownershipAlwaysActive = false;
	const ownershipKeyRef = useRef(ownershipKey);
	const claimedRef = useRef(false);
	const deactivateRef = useRef<() => void>();
	const lastAutomaticCandidateSignatureRef = useRef<string>();
	const [ownershipRevision, setOwnershipRevision] = useState(0);

	useEffect(() => {
		ownershipKeyRef.current = ownershipKey;
	}, [ownershipKey]);
	useEffect(
		() =>
			interactionOwnership.subscribe(() =>
				setOwnershipRevision((revision) => revision + 1),
			),
		[],
	);

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
				ownershipAlwaysActive,
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
	}, [setSuspended]);
	const resume = useCallback(() => setSuspended(false), [setSuspended]);

	const {releaseInteraction, takeOverInteraction} =
		useInteractionRequestLifecycle({
			viewportId,
			active: selectionRegistered,
			persistent: alwaysActive,
			onDisable,
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
		if (
			claimedRef.current &&
			lastAutomaticCandidateSignatureRef.current === candidateSignature
		)
			return;
		lastAutomaticCandidateSignatureRef.current = candidateSignature;

		const result = interactionOwnership.acquire(
			viewportId,
			ownershipKey,
			label,
			"selection",
			ownershipAlwaysActive,
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
		// This is an automatic reclaim after another interaction changed. A
		// conflict is expected while the user-selected interaction owns these
		// nodes, so it must not produce a user-facing warning.
	}, [
		automaticallyActivated,
		candidateNodes,
		candidateSignature,
		label,
		ownershipRevision,
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

	return {tryAcquireClaim, releaseInteraction, takeOverInteraction};
};
