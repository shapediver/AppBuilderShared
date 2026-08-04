import {useLayoutEffect, useRef, useSyncExternalStore} from "react";

let pendingSelections: Readonly<Record<string, string>> = {};
const pendingStateRefs = new Map<
	string,
	{current: {pending: boolean; scopeKey: string}}
>();
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

/** Checks the current registry synchronously before an automatic commit. */
export const hasOtherPendingSelectionInScope = (
	ownerKey: string,
	scopeKey: string,
) =>
	Object.entries(pendingSelections).some(
		([registeredOwnerKey, registeredScopeKey]) => {
			const registeredState = pendingStateRefs.get(registeredOwnerKey);
			return (
				registeredOwnerKey !== ownerKey &&
				registeredScopeKey === scopeKey &&
				(registeredState?.current.pending ?? true)
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
		pendingStateRefs.set(ownerKey, pendingStateRef);
		if (pending) markPendingSelection(ownerKey, scopeKey);
		else clearPendingSelection(ownerKey);
		return () => {
			pendingStateRefs.delete(ownerKey);
			clearPendingSelection(ownerKey);
		};
	}, [ownerKey, pending, scopeKey]);

	return Object.entries(snapshot).some(
		([registeredOwnerKey, registeredScopeKey]) => {
			const registeredState = pendingStateRefs.get(registeredOwnerKey);
			return (
				registeredOwnerKey !== ownerKey &&
				registeredScopeKey === scopeKey &&
				(registeredState?.current.pending ?? true)
			);
		},
	);
};
