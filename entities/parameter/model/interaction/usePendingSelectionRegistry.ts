import {useLayoutEffect, useRef, useSyncExternalStore} from "react";

let pendingSelections: Readonly<Record<string, string>> = {};
type PendingStateRef = {current: {pending: boolean; scopeKey: string}};
const pendingStateRefs = new Map<string, Set<PendingStateRef>>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/** Marks a local selection draft before its viewer state is changed. */
export const markPendingSelection = (ownerKey: string, scopeKey: string) => {
	if (pendingSelections[ownerKey] === scopeKey) return;
	pendingSelections = {...pendingSelections, [ownerKey]: scopeKey};
	notify();
};

/** Clears a local selection draft after it is committed or discarded. */
export const clearPendingSelection = (ownerKey: string) => {
	if (!pendingSelections[ownerKey]) return;
	const next = {...pendingSelections};
	delete next[ownerKey];
	pendingSelections = next;
	notify();
};

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

const getSnapshot = () => pendingSelections;

const hasPendingMountedInstance = (ownerKey: string) => {
	const refs = pendingStateRefs.get(ownerKey);
	return refs
		? Array.from(refs).some((ref) => ref.current.pending)
		: undefined;
};

/** Checks the current registry synchronously before an automatic commit. */
export const hasOtherPendingSelectionInScope = (
	ownerKey: string,
	scopeKey: string,
) =>
	Object.entries(pendingSelections).some(
		([registeredOwnerKey, registeredScopeKey]) => {
			const registeredState =
				hasPendingMountedInstance(registeredOwnerKey);
			return (
				registeredOwnerKey !== ownerKey &&
				registeredScopeKey === scopeKey &&
				(registeredState ?? true)
			);
		},
	);

/**
 * Tracks unconfirmed node selections across parameters in one viewport and
 * namespace. An existing pending selection suppresses automatic acceptance of
 * another selection parameter.
 */
export const usePendingSelectionRegistry = (
	ownerKey: string,
	scopeKey: string,
	pending: boolean,
) => {
	const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
	const pendingStateRef = useRef({pending, scopeKey});
	pendingStateRef.current = {pending, scopeKey};

	// A pending draft gates automatic interaction commits. Keep this registry in
	// sync before the browser can process the next toolbar/viewport action.
	useLayoutEffect(() => {
		const refs =
			pendingStateRefs.get(ownerKey) ?? new Set<PendingStateRef>();
		refs.add(pendingStateRef);
		pendingStateRefs.set(ownerKey, refs);
		if (Array.from(refs).some((ref) => ref.current.pending))
			markPendingSelection(ownerKey, scopeKey);
		else clearPendingSelection(ownerKey);
		return () => {
			const registeredRefs = pendingStateRefs.get(ownerKey);
			registeredRefs?.delete(pendingStateRef);
			if (registeredRefs?.size) {
				const remainingPending = Array.from(registeredRefs).some(
					(ref) => ref.current.pending,
				);
				if (!remainingPending) clearPendingSelection(ownerKey);
				return;
			}
			pendingStateRefs.delete(ownerKey);
			clearPendingSelection(ownerKey);
		};
	}, [ownerKey, pending, scopeKey]);

	return Object.entries(snapshot).some(
		([registeredOwnerKey, registeredScopeKey]) => {
			const registeredState =
				hasPendingMountedInstance(registeredOwnerKey);
			return (
				registeredOwnerKey !== ownerKey &&
				registeredScopeKey === scopeKey &&
				(registeredState ?? true)
			);
		},
	);
};
