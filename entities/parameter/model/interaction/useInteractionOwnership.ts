import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";

import {type CandidateNode, interactionOwnership} from "./interactionOwnership";

/**
 * Encapsulates the ownership lifecycle for any interaction parameter that
 * resolves candidate nodes (selection, dragging, gumball, rectangle transform).
 *
 * The hook owns:
 * - automatic claim when `automaticallyActivated && !conflict`
 * - user-initiated claim via `tryAcquireClaim(true)` (displaces non-alwaysActive)
 * - revalidation when candidates change while active
 * - release on deactivation / unmount
 */
export function useInteractionOwnership(options: {
	viewportId: string;
	ownerKey: string;
	ownerLabel: string;
	type: string;
	alwaysActive: boolean;
	automaticallyActivated: boolean;
	candidateNodes: CandidateNode[];
	/** Whether the interaction is currently active (selectionActive, draggingActive, etc.). */
	active: boolean;
}): {
	/** Whether ownership is blocked (automatic claim failed). */
	ownershipBlocked: boolean;
	/**
	 * Attempt to acquire a claim. Returns true if granted.
	 * When `userRequested=true`, displaces non-alwaysActive owners.
	 * When `userRequested=false`, rejects silently on conflict.
	 */
	tryAcquireClaim: (userRequested: boolean) => boolean;
} {
	const {
		viewportId,
		ownerKey,
		ownerLabel,
		type,
		alwaysActive,
		automaticallyActivated,
		candidateNodes,
		active,
	} = options;

	const notifications = useNotificationStore();
	const claimedRef = useRef(false);
	const [ownershipBlocked, setOwnershipBlocked] = useState(
		automaticallyActivated,
	);

	const releaseClaim = useCallback(() => {
		interactionOwnership.release(viewportId, ownerKey);
		claimedRef.current = false;
	}, [viewportId, ownerKey]);

	// tryAcquireClaim — user or automatic.
	const tryAcquireClaim = useCallback(
		(userRequested: boolean): boolean => {
			if (candidateNodes.length === 0) return false;
			const result = interactionOwnership.acquire(
				viewportId,
				ownerKey,
				ownerLabel,
				type,
				alwaysActive,
				candidateNodes,
				() => {
					releaseClaim();
					setOwnershipBlocked(true);
				},
				userRequested,
			);
			if (result.acquired) {
				claimedRef.current = true;
				setOwnershipBlocked(false);
				return true;
			}
			notifications.warning({
				title: `${type} unavailable`,
				message: `${ownerLabel} shares selectable nodes with ${(result as {conflictingOwners: string[]}).conflictingOwners.join(", ")}.`,
			});
			return false;
		},
		[
			candidateNodes,
			viewportId,
			ownerKey,
			ownerLabel,
			type,
			alwaysActive,
			releaseClaim,
			notifications,
		],
	);

	// Automatic activation effect.
	const candidateSignature = useMemo(
		() =>
			candidateNodes
				.map((c) => c.nodeId)
				.sort()
				.join(","),
		[candidateNodes],
	);
	const lastAutoSignatureRef = useRef<string>();

	useEffect(() => {
		if (!automaticallyActivated || candidateNodes.length === 0) return;
		if (lastAutoSignatureRef.current === candidateSignature) return;
		lastAutoSignatureRef.current = candidateSignature;

		const result = interactionOwnership.acquire(
			viewportId,
			ownerKey,
			ownerLabel,
			type,
			alwaysActive,
			candidateNodes,
			() => {
				releaseClaim();
				setOwnershipBlocked(true);
			},
			false,
		);
		if (result.acquired) {
			claimedRef.current = true;
			setOwnershipBlocked(false);
			return;
		}
		claimedRef.current = false;
		setOwnershipBlocked(true);
		notifications.warning({
			title: `${type} unavailable`,
			message: `${ownerLabel} shares selectable nodes with ${(result as {conflictingOwners: string[]}).conflictingOwners.join(", ")}.`,
		});
	}, [
		automaticallyActivated,
		candidateNodes,
		candidateSignature,
		viewportId,
		ownerKey,
		ownerLabel,
		type,
		alwaysActive,
		releaseClaim,
		notifications,
	]);

	// Revalidate active claim when candidates change.
	useEffect(() => {
		if (active && claimedRef.current) {
			const result = interactionOwnership.update(
				viewportId,
				ownerKey,
				candidateNodes,
			);
			if (!result.updated) {
				claimedRef.current = false;
				setOwnershipBlocked(true);
				notifications.warning({
					title: `${type} deactivated`,
					message: `${ownerLabel} now shares selectable nodes with ${(result as {conflictingOwners: string[]}).conflictingOwners.join(", ")}.`,
				});
			}
		} else if (!active && claimedRef.current) {
			interactionOwnership.release(viewportId, ownerKey);
			claimedRef.current = false;
		}
	}, [
		active,
		candidateNodes,
		viewportId,
		ownerKey,
		ownerLabel,
		type,
		notifications,
	]);

	// Release on unmount.
	useEffect(() => {
		return () => {
			if (claimedRef.current) {
				interactionOwnership.release(viewportId, ownerKey);
				claimedRef.current = false;
			}
		};
	}, [viewportId, ownerKey]);

	return {
		ownershipBlocked,
		tryAcquireClaim,
	};
}
