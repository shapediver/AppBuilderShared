import type {IShapeDiverStoreParameters} from "../config/shapediverStoreParameters";
import {useShapeDiverStoreParameters} from "../model/useShapeDiverStoreParameters";

/**
 * Namespaces whose queued changes belong to this app session.
 *
 * Includes the session itself, sessions it depends on, and namespaces that
 * depend on it. App Builder custom parameters are registered under a separate
 * namespace that depends on the session, so their accept/reject queue lives
 * there rather than on the session id.
 */
export function parameterChangeNamespaces(
	namespace: string,
	state: IShapeDiverStoreParameters,
): string[] {
	if (!namespace) return [];

	const ids = new Set<string>([namespace]);
	for (const id of state.sessionDependency[namespace] ?? []) ids.add(id);
	for (const [id, dependencies] of Object.entries(state.sessionDependency)) {
		if (dependencies.includes(namespace)) ids.add(id);
	}

	return [...ids];
}

/** Whether the namespace has parameter changes awaiting accept or reject. */
export function hasPendingParameterChanges(
	namespace: string,
	state: IShapeDiverStoreParameters = useShapeDiverStoreParameters.getState(),
): boolean {
	return parameterChangeNamespaces(namespace, state).some(
		(sessionId) =>
			Object.keys(state.parameterChanges[sessionId]?.values ?? {})
				.length > 0,
	);
}

/** Whether one of those namespaces is currently executing accepted changes. */
export function hasExecutingParameterChanges(
	namespace: string,
	state: IShapeDiverStoreParameters = useShapeDiverStoreParameters.getState(),
): boolean {
	return parameterChangeNamespaces(namespace, state).some(
		(sessionId) => state.parameterChanges[sessionId]?.executing ?? false,
	);
}
