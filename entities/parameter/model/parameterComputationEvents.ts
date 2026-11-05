import {
	isSessionCustomizationFailedTask,
	isSessionCustomizationParallelTask,
	SESSION_CUSTOMIZATION_TASK_TYPE,
} from "@AppBuilderLib/shared/lib/sessionCustomizationTask";
import {
	addListener,
	EVENTTYPE,
	removeListener,
	type ITaskEvent,
} from "@shapediver/viewer.session";

/**
 * Which parameters a session customization computes.
 *
 * The viewer task events of a customization only carry the session id. The
 * parameter executor of the session knows which parameter values it sends,
 * so it reports them here ({@link markParametersInCustomization}) right
 * before it asks the viewer to customize. They are remembered until the
 * matching task ends:
 *
 * - `end`: `TASK_END`, which the viewer emits after the session scene node
 *   was replaced.
 * - `error`: `TASK_CANCEL` with status `Session customization failed`.
 * - `start`: `TASK_START`. The parameters stay pending.
 *
 * A customization that is superseded by a newer one is cancelled with
 * another status. It does not end the pending parameters: the newer
 * customization sends every current value, so those parameters are part of
 * it. Instance computations (`customize_parallel`) change neither the values
 * nor the scene node of the session and are ignored.
 *
 * Accept/reject mode needs nothing special: the executor only runs once a
 * queued change is accepted.
 */

export type ParameterComputationEventType = "start" | "end" | "error";

export type ParameterComputationEvent = {
	/** Id of the session. */
	sessionId: string;
	/** Ids (as used by the session) of the parameters of the customization. */
	parameterIds: string[];
};

export type ParameterComputationListener = (
	event: ParameterComputationEvent,
) => void;

/**
 * Pending parameter ids per session id. The value tells whether a viewer
 * task has started since the id was reported.
 */
const pending = new Map<string, Map<string, boolean>>();

const listeners: Record<
	ParameterComputationEventType,
	Set<ParameterComputationListener>
> = {
	start: new Set(),
	end: new Set(),
	error: new Set(),
};

let taskListenerTokens: string[] | undefined;

function getTaskSessionId(event: ITaskEvent): string | undefined {
	const data = event.data as {sessionId?: unknown} | undefined;
	return typeof data?.sessionId === "string" && data.sessionId.length > 0
		? data.sessionId
		: undefined;
}

function emit(
	type: ParameterComputationEventType,
	sessionId: string,
	parameterIds: string[],
) {
	if (parameterIds.length === 0) return;
	// copy: a listener may unsubscribe while we iterate
	for (const listener of [...listeners[type]]) {
		listener({sessionId, parameterIds});
	}
}

function handleTaskEvent(
	event: ITaskEvent,
	type: ParameterComputationEventType,
	isFinal: boolean,
) {
	if (event.type !== SESSION_CUSTOMIZATION_TASK_TYPE) return;
	if (isSessionCustomizationParallelTask(event)) return;
	const sessionId = getTaskSessionId(event);
	if (!sessionId) return;
	const ids = pending.get(sessionId);
	if (!ids || ids.size === 0) return;
	const parameterIds = [...ids.keys()];
	if (isFinal) pending.delete(sessionId);
	else parameterIds.forEach((id) => ids.set(id, true));
	emit(type, sessionId, parameterIds);
}

function ensureTaskListeners() {
	if (taskListenerTokens) return;
	taskListenerTokens = [
		addListener(EVENTTYPE.TASK.TASK_START, (event) =>
			handleTaskEvent(event as ITaskEvent, "start", false),
		),
		addListener(EVENTTYPE.TASK.TASK_END, (event) =>
			handleTaskEvent(event as ITaskEvent, "end", true),
		),
		addListener(EVENTTYPE.TASK.TASK_CANCEL, (event) => {
			const taskEvent = event as ITaskEvent;
			// a superseded customization is not an error: its parameters stay
			// pending for the customization that replaced it
			if (!isSessionCustomizationFailedTask(taskEvent)) return;
			handleTaskEvent(taskEvent, "error", true);
		}),
	];
}

/**
 * Report the parameters whose values a customization of the session is
 * about to send. Call it right before the viewer is asked to customize.
 *
 * @param sessionId Id of the session.
 * @param parameterIds Ids of the parameters, as used by the session.
 */
export function markParametersInCustomization(
	sessionId: string,
	parameterIds: readonly string[],
) {
	if (parameterIds.length === 0) return;
	ensureTaskListeners();
	let ids = pending.get(sessionId);
	if (!ids) {
		ids = new Map();
		pending.set(sessionId, ids);
	}
	// keep the flag of an id that is already pending
	parameterIds.forEach((id) => {
		if (!ids.has(id)) ids.set(id, false);
	});
}

/**
 * Forget parameters that were reported but never reached a viewer task
 * (for example because the executor threw before customizing).
 * Does nothing for parameters that were already handed to a listener or
 * that belong to a task which started. Such a task ends, fails or is
 * superseded, and the viewer events decide what happens to them.
 */
export function unmarkParametersInCustomization(
	sessionId: string,
	parameterIds: readonly string[],
) {
	const ids = pending.get(sessionId);
	if (!ids) return;
	parameterIds.forEach((id) => {
		if (ids.get(id) === false) ids.delete(id);
	});
	if (ids.size === 0) pending.delete(sessionId);
}

/**
 * Listen to the computation of parameters. The listener receives the session
 * id and the ids of all parameters of that customization.
 *
 * @returns A function that removes the listener.
 */
export function addParameterComputationListener(
	type: ParameterComputationEventType,
	listener: ParameterComputationListener,
): () => void {
	listeners[type].add(listener);
	return () => {
		listeners[type].delete(listener);
	};
}

/** Forget all pending parameters and listeners. For tests. */
export function resetParameterComputationEvents() {
	pending.clear();
	Object.values(listeners).forEach((set) => set.clear());
	taskListenerTokens?.forEach((token) => removeListener(token));
	taskListenerTokens = undefined;
}
