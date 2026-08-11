import {useEffect, useSyncExternalStore} from "react";

interface SelectionAutoClearRequest {
	revision: number;
	value: string;
}

let requests: Readonly<Record<string, SelectionAutoClearRequest>> = {};
const listeners = new Set<() => void>();
const cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();
const mountCounts = new Map<string, number>();

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

const getSnapshot = () => requests;

const notify = () => listeners.forEach((listener) => listener());

/** Records a completed selection whose committed value must stay UI-cleared. */
export const requestSelectionAutoClear = (ownerKey: string, value: string) => {
	const previous = requests[ownerKey];
	requests = {
		...requests,
		[ownerKey]: {
			revision: (previous?.revision ?? 0) + 1,
			value,
		},
	};
	notify();
};

/**
 * Keeps an auto-clear request across the parameter rebuild caused by its own
 * computation, but discards it once that parameter is actually removed.
 */
export const useSelectionAutoClear = (ownerKey: string) => {
	const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	useEffect(() => {
		mountCounts.set(ownerKey, (mountCounts.get(ownerKey) ?? 0) + 1);
		const cleanupTimer = cleanupTimers.get(ownerKey);
		if (cleanupTimer) {
			clearTimeout(cleanupTimer);
			cleanupTimers.delete(ownerKey);
		}

		return () => {
			const remainingMounts = (mountCounts.get(ownerKey) ?? 1) - 1;
			if (remainingMounts > 0) {
				mountCounts.set(ownerKey, remainingMounts);
				return;
			}
			mountCounts.delete(ownerKey);
			cleanupTimers.set(
				ownerKey,
				setTimeout(() => {
					cleanupTimers.delete(ownerKey);
					if (!requests[ownerKey]) return;
					const next = {...requests};
					delete next[ownerKey];
					requests = next;
					notify();
				}, 0),
			);
		};
	}, [ownerKey]);

	return snapshot[ownerKey];
};
