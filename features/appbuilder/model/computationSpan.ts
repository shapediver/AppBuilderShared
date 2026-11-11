import {useShapeDiverStoreProcessManager} from "@AppBuilderLib/shared/model/useShapeDiverStoreProcessManager";

/**
 * One customization, from the process manager that is opened for it until
 * the last process manager of that same customization is gone.
 *
 * `computationstart` runs when the span opens. That manager is created
 * before `customize()`, so the slot is earlier than TASK_START. Further
 * managers of the same session that appear while the span is open, such as
 * the instance rebuild, belong to it. `computationend` runs when the last
 * of them is gone, which is after TASK_END and after the new instances are
 * registered. A customization that never opens a span keeps the task events.
 */
export type ComputationSpanEvent = {
	type: "start" | "end";
	sessionId: string;
};

type Span = {
	sessionId: string;
	members: Set<string>;
	/**
	 * Increases every time another customization joins. A failure applies
	 * only to the customization that was current then.
	 */
	generation: number;
	failed: boolean;
};

type ProcessManagers = ReturnType<
	typeof useShapeDiverStoreProcessManager.getState
>["processManagers"];

const spans = new Map<string, Span>();
const listeners = new Set<(event: ComputationSpanEvent) => void>();

let knownManagerIds = new Set<string>();

const managerIds = (processManagers: ProcessManagers): string[] =>
	Object.keys(processManagers);

const emit = (event: ComputationSpanEvent) => {
	for (const listener of [...listeners]) listener(event);
};

const syncManagers = (processManagers: ProcessManagers) => {
	const now = new Set(managerIds(processManagers));
	const added: string[] = [];
	const removed: string[] = [];
	for (const id of now) if (!knownManagerIds.has(id)) added.push(id);
	for (const id of knownManagerIds) if (!now.has(id)) removed.push(id);
	knownManagerIds = now;

	for (const span of [...spans.values()]) {
		for (const id of added) {
			const manager = processManagers[id];
			if (manager?.controllerSessionId === span.sessionId)
				span.members.add(id);
		}
		for (const id of removed) span.members.delete(id);
		if (span.members.size === 0) {
			spans.delete(span.sessionId);
			if (!span.failed) emit({type: "end", sessionId: span.sessionId});
		}
	}
};

useShapeDiverStoreProcessManager.subscribe((state) => {
	syncManagers(state.processManagers);
});
knownManagerIds = new Set(
	managerIds(useShapeDiverStoreProcessManager.getState().processManagers),
);

/** The customization of `sessionId` has a process manager open. */
export const isComputationSpanOpen = (sessionId: string): boolean =>
	spans.has(sessionId);

/**
 * Open the span on the process manager created for this customization, or
 * join that manager to the span already open for the session. Runs
 * `computationstart` only when the span opens.
 */
export const beginComputationSpan = (
	sessionId: string,
	processManagerId: string,
): number => {
	const current = spans.get(sessionId);
	if (current) {
		current.members.add(processManagerId);
		// A newer customization joined. An older failure must not swallow
		// this one's computationend.
		current.failed = false;
		current.generation += 1;
		return current.generation;
	}
	spans.set(sessionId, {
		sessionId,
		members: new Set([processManagerId]),
		generation: 1,
		failed: false,
	});
	emit({type: "start", sessionId});
	return 1;
};

/**
 * The customization that `beginComputationSpan` returned `generation` for
 * has failed. The span closes without `computationend` when its process
 * managers are gone, unless a newer customization has joined since.
 */
export const failComputationSpan = (
	sessionId: string,
	generation: number,
): void => {
	const span = spans.get(sessionId);
	if (!span || span.generation !== generation) return;
	span.failed = true;
};

export const subscribeComputationSpan = (
	listener: (event: ComputationSpanEvent) => void,
): (() => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

/** Test-only. Drops open spans and resyncs the known process managers. */
export const resetComputationSpansForTests = (): void => {
	spans.clear();
	knownManagerIds = new Set(
		managerIds(useShapeDiverStoreProcessManager.getState().processManagers),
	);
};
