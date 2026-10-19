import {IParameterChanges} from "../config/shapediverStoreParameters";
import {useShapeDiverStoreParameters} from "../model/useShapeDiverStoreParameters";

const inlineParameters = new Map<string, number>();
let inlineEpoch = 0;
const listeners = new Set<() => void>();

const inlineKey = (namespace: string, parameterId: string) =>
	`${namespace}\0${parameterId}`;

const notify = () => {
	inlineEpoch += 1;
	listeners.forEach((listener) => listener());
};

/**
 * Remember that a mounted parameter widget presents accept/reject inline,
 * so the shared viewport and toolbar buttons leave that parameter alone.
 */
export function registerInlineAcceptRejectParameter(
	namespace: string,
	parameterId: string,
): () => void {
	const key = inlineKey(namespace, parameterId);
	inlineParameters.set(key, (inlineParameters.get(key) ?? 0) + 1);
	notify();

	return () => {
		const next = (inlineParameters.get(key) ?? 1) - 1;
		if (next <= 0) inlineParameters.delete(key);
		else inlineParameters.set(key, next);
		notify();
	};
}

export function isInlineAcceptRejectParameter(
	namespace: string,
	parameterId: string,
): boolean {
	return inlineParameters.has(inlineKey(namespace, parameterId));
}

export function subscribeInlineAcceptReject(listener: () => void): () => void {
	listeners.add(listener);

	return () => {
		listeners.delete(listener);
	};
}

export function getInlineAcceptRejectEpoch(): number {
	return inlineEpoch;
}

/** Queued parameter ids that still belong to the shared accept/reject buttons. */
export function globalPendingParameterIds(
	namespace: string,
	values: {[parameterId: string]: unknown},
): string[] {
	return Object.keys(values).filter(
		(parameterId) => !isInlineAcceptRejectParameter(namespace, parameterId),
	);
}

export function hasGlobalPendingParameterChanges(parameterChanges: {
	[namespace: string]: IParameterChanges | undefined;
}): boolean {
	return Object.keys(parameterChanges).some((namespace) => {
		const values = parameterChanges[namespace]?.values;
		if (!values) return false;

		return globalPendingParameterIds(namespace, values).length > 0;
	});
}

export async function acceptQueuedParameterIds(
	entries: {namespace: string; changes: IParameterChanges}[],
	parameterIds: {namespace: string; parameterId: string}[],
): Promise<void> {
	for (const entry of entries) {
		const ids = parameterIds
			.filter((item) => item.namespace === entry.namespace)
			.map((item) => item.parameterId)
			.filter((parameterId) => parameterId in entry.changes.values);
		if (ids.length === 0) continue;
		const acceptAll =
			ids.length === Object.keys(entry.changes.values).length;
		await entry.changes.accept(undefined, acceptAll ? undefined : ids);
	}
}

export function rejectQueuedParameterIds(
	entries: {namespace: string; changes: IParameterChanges}[],
	parameterIds: {namespace: string; parameterId: string}[],
): void {
	const store = useShapeDiverStoreParameters.getState();
	for (const entry of entries) {
		const ids = parameterIds
			.filter((item) => item.namespace === entry.namespace)
			.map((item) => item.parameterId)
			.filter((parameterId) => parameterId in entry.changes.values);
		if (ids.length === 0) continue;
		const rejectAll =
			ids.length === Object.keys(entry.changes.values).length;
		if (rejectAll) {
			entry.changes.reject();
			continue;
		}
		for (const parameterId of ids) {
			const {isEmpty} = entry.changes.removeValueChange(parameterId);
			store
				.getParameter(entry.namespace, parameterId)
				?.getState()
				.actions.resetToCommitValue();
			if (isEmpty) {
				entry.changes.reject();
				break;
			}
		}
	}
}

export async function acceptGlobalParameterChanges(
	entries: {namespace: string; changes: IParameterChanges}[],
): Promise<void> {
	for (const entry of entries) {
		const parameterIds = globalPendingParameterIds(
			entry.namespace,
			entry.changes.values,
		);
		if (parameterIds.length === 0) continue;
		const acceptAll =
			parameterIds.length === Object.keys(entry.changes.values).length;
		await entry.changes.accept(
			undefined,
			acceptAll ? undefined : parameterIds,
		);
	}
}

export function rejectGlobalParameterChanges(
	entries: {namespace: string; changes: IParameterChanges}[],
): void {
	const store = useShapeDiverStoreParameters.getState();
	for (const entry of entries) {
		const parameterIds = globalPendingParameterIds(
			entry.namespace,
			entry.changes.values,
		);
		if (parameterIds.length === 0) continue;
		const rejectAll =
			parameterIds.length === Object.keys(entry.changes.values).length;
		if (rejectAll) {
			entry.changes.reject();
			continue;
		}
		for (const parameterId of parameterIds) {
			const {isEmpty} = entry.changes.removeValueChange(parameterId);
			store
				.getParameter(entry.namespace, parameterId)
				?.getState()
				.actions.resetToCommitValue();
			if (isEmpty) {
				entry.changes.reject();
				break;
			}
		}
	}
}
