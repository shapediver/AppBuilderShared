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
 * The viewer task events of a customization only carry the session id and
 * the id of the task. The parameter executor of the session knows which
 * parameter values it sends, so it reports them here
 * ({@link markParametersInCustomization}) right before it asks the viewer to
 * customize. The reported parameters are handed to the next task that
 * starts, and are remembered until that task ends:
 *
 * - `start`: `TASK_START`. The parameters of the task stay pending.
 * - `end`: `TASK_END`, which the viewer emits after the session scene node
 *   was replaced.
 * - `error`: `TASK_CANCEL` with status `Session customization failed`.
 *
 * A customization that is superseded by a newer one is cancelled with
 * another status. It does not end its parameters: the newer customization
 * sends every current value, so they move to the newest other task that is
 * running, or wait for the next one. Instance computations
 * (`customize_parallel`) change neither the values nor the scene node of
 * the session and are ignored.
 *
 * Tasks that overlap without superseding each other (computations via
 * exports) each end with their own parameters.
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

type SessionState = {
	/**
	 * Parameters that were reported and wait for a task. The value tells
	 * whether a task had them already, which means that only the task
	 * events may release them.
	 */
	waiting: Map<string, boolean>;
	/** Parameters of the running tasks, by task id (in start order). */
	tasks: Map<string, string[]>;
};

const sessions = new Map<string, SessionState>();

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

function getTaskId(event: ITaskEvent): string {
	return typeof event.id === "string" ? event.id : "";
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

function cleanUp(sessionId: string, state: SessionState) {
	if (state.waiting.size === 0 && state.tasks.size === 0)
		sessions.delete(sessionId);
}

/** Hand all waiting parameters to the task. */
function claim(state: SessionState, taskId: string): string[] {
	const ids = [...(state.tasks.get(taskId) ?? [])];
	for (const id of state.waiting.keys()) {
		if (!ids.includes(id)) ids.push(id);
	}
	state.waiting.clear();
	state.tasks.set(taskId, ids);
	return ids;
}

function handleTaskStart(event: ITaskEvent) {
	if (event.type !== SESSION_CUSTOMIZATION_TASK_TYPE) return;
	if (isSessionCustomizationParallelTask(event)) return;
	const sessionId = getTaskSessionId(event);
	if (!sessionId) return;
	const state = sessions.get(sessionId);
	if (!state || state.waiting.size === 0) return;
	emit("start", sessionId, claim(state, getTaskId(event)));
}

function handleTaskFinal(event: ITaskEvent, type: "end" | "error") {
	if (event.type !== SESSION_CUSTOMIZATION_TASK_TYPE) return;
	if (isSessionCustomizationParallelTask(event)) return;
	const sessionId = getTaskSessionId(event);
	if (!sessionId) return;
	const state = sessions.get(sessionId);
	if (!state) return;
	const taskId = getTaskId(event);
	// a task that did not start (no start event seen) takes what waits
	const ids = state.tasks.has(taskId)
		? [...state.tasks.get(taskId)!]
		: [...state.waiting.keys()];
	if (state.tasks.has(taskId)) state.tasks.delete(taskId);
	else state.waiting.clear();
	cleanUp(sessionId, state);
	emit(type, sessionId, ids);
}

function handleTaskSuperseded(event: ITaskEvent) {
	if (event.type !== SESSION_CUSTOMIZATION_TASK_TYPE) return;
	if (isSessionCustomizationParallelTask(event)) return;
	const sessionId = getTaskSessionId(event);
	if (!sessionId) return;
	const state = sessions.get(sessionId);
	if (!state) return;
	const taskId = getTaskId(event);
	const ids = state.tasks.get(taskId);
	if (!ids) return;
	state.tasks.delete(taskId);
	// the newer customization sends all values: it takes over the parameters
	const newerTaskId = [...state.tasks.keys()].pop();
	if (newerTaskId !== undefined) {
		const newerIds = state.tasks.get(newerTaskId)!;
		ids.forEach((id) => {
			if (!newerIds.includes(id)) newerIds.push(id);
		});
	} else {
		ids.forEach((id) => state.waiting.set(id, true));
	}
}

function ensureTaskListeners() {
	if (taskListenerTokens) return;
	taskListenerTokens = [
		addListener(EVENTTYPE.TASK.TASK_START, (event) =>
			handleTaskStart(event as ITaskEvent),
		),
		addListener(EVENTTYPE.TASK.TASK_END, (event) =>
			handleTaskFinal(event as ITaskEvent, "end"),
		),
		addListener(EVENTTYPE.TASK.TASK_CANCEL, (event) => {
			const taskEvent = event as ITaskEvent;
			if (isSessionCustomizationFailedTask(taskEvent))
				handleTaskFinal(taskEvent, "error");
			else handleTaskSuperseded(taskEvent);
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
	let state = sessions.get(sessionId);
	if (!state) {
		state = {waiting: new Map(), tasks: new Map()};
		sessions.set(sessionId, state);
	}
	const {waiting} = state;
	// keep the flag of an id that is already waiting
	parameterIds.forEach((id) => {
		if (!waiting.has(id)) waiting.set(id, false);
	});
}

/**
 * Forget parameters that were reported but never reached a viewer task
 * (for example because the executor threw before customizing).
 * Does nothing for parameters that were already handed to a task. Such a
 * task ends, fails or is superseded, and the viewer events decide what
 * happens to them.
 */
export function unmarkParametersInCustomization(
	sessionId: string,
	parameterIds: readonly string[],
) {
	const state = sessions.get(sessionId);
	if (!state) return;
	parameterIds.forEach((id) => {
		if (state.waiting.get(id) === false) state.waiting.delete(id);
	});
	cleanUp(sessionId, state);
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
	sessions.clear();
	Object.values(listeners).forEach((set) => set.clear());
	taskListenerTokens?.forEach((token) => removeListener(token));
	taskListenerTokens = undefined;
}
