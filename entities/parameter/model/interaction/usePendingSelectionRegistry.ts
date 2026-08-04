import {useEffect, useSyncExternalStore} from "react";

let pendingSelections: Readonly<Record<string, string>> = {};
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

const registerPendingSelection = (ownerKey: string, scopeKey: string) => {
	if (pendingSelections[ownerKey] === scopeKey) return;
	pendingSelections = {...pendingSelections, [ownerKey]: scopeKey};
	notify();
};

const unregisterPendingSelection = (ownerKey: string) => {
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

	useEffect(() => {
		if (pending) registerPendingSelection(ownerKey, scopeKey);
		else unregisterPendingSelection(ownerKey);
		return () => unregisterPendingSelection(ownerKey);
	}, [ownerKey, pending, scopeKey]);

	return Object.entries(snapshot).some(
		([registeredOwnerKey, registeredScopeKey]) =>
			registeredOwnerKey !== ownerKey && registeredScopeKey === scopeKey,
	);
};
