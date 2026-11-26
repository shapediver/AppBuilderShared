/**
 * A parameter value written by `commit` without a customization.
 *
 * The computation-slot filter reads `session.parameters[id].value`. A commit
 * changes that value and emits no task, so the filter has to hear about it
 * or the next unrelated customization looks like a change of this parameter.
 */

type ParameterCommitListener = (value: unknown) => void;

const listeners = new Map<string, Set<ParameterCommitListener>>();

const key = (sessionId: string, parameterId: string) =>
	`${sessionId}\0${parameterId}`;

export function noteParameterCommitted(
	sessionId: string,
	parameterId: string,
	value: unknown,
): void {
	const set = listeners.get(key(sessionId, parameterId));
	if (!set) return;
	for (const listener of set) listener(value);
}

export function subscribeParameterCommitted(
	sessionId: string,
	parameterId: string,
	listener: ParameterCommitListener,
): () => void {
	const id = key(sessionId, parameterId);
	let set = listeners.get(id);
	if (!set) {
		set = new Set();
		listeners.set(id, set);
	}
	set.add(listener);

	return () => {
		set.delete(listener);
		if (set.size === 0) listeners.delete(id);
	};
}
