import {Logger} from "@AppBuilderLib/shared/lib/logger";
import type {ISessionsHistoryState} from "../config/shapediverStoreParameters";

/** A parameter value waiting to be sent. */
export interface IScheduledParameterChange {
	/** Session namespace of the parameter. */
	namespace: string;
	/** Id of the parameter. */
	parameterId: string;
	/** The value to send. */
	value: unknown;
	/**
	 * Time in ms the change waits for further changes, 0 sends it (together
	 * with all other pending changes) right away.
	 */
	timeout: number;
	/** Execute the value even if it equals the executed value. */
	forceSameValue?: boolean;
	/**
	 * Called when the value is sent (e.g. to execute delegates), runs
	 * together with the request.
	 */
	onSend?: (value: unknown) => Promise<unknown>;
	/** Called once the request sending the value ended. */
	onSent?: () => void;
	/**
	 * Called when the value is dropped without being sent, because a restored
	 * state replaces it (e.g. undo, see {@link ParameterChangeScheduler.discard}).
	 */
	onDiscard?: () => void;
}

/** Sends all pending changes (see {@link ParameterChangeScheduler.take}). */
export type ParameterChangeSender = () => Promise<void>;

/**
 * Pending changes taken from the scheduler, to be sent with a request
 * (see {@link ParameterChangeScheduler.take}).
 */
export class ScheduledParameterChanges {
	constructor(readonly changes: readonly IScheduledParameterChange[]) {}

	/** Whether no changes were taken. */
	get isEmpty(): boolean {
		return this.changes.length === 0;
	}

	/**
	 * Add the values to the given values of a request. A value given for the
	 * same parameter (by its id, see the keys of `state`) wins: the pending
	 * change is overridden.
	 *
	 * @param state The values of the request, keyed by parameter id.
	 * @param forceSameValue Parameters of the request executed even if their
	 * value equals the executed value, per namespace.
	 * @returns the merged values, and the changes sent with them (`included`,
	 * see {@link sendAlong}) or `overridden` by the request.
	 */
	mergeInto(
		state: ISessionsHistoryState,
		forceSameValue: {[namespace: string]: string[]} = {},
	): {
		state: ISessionsHistoryState;
		forceSameValue: {[namespace: string]: string[]};
		included: ScheduledParameterChanges;
		overridden: IScheduledParameterChange[];
	} {
		const merged: ISessionsHistoryState = {};
		const mergedForceSameValue: {[namespace: string]: string[]} = {};
		const included: IScheduledParameterChange[] = [];
		const overridden: IScheduledParameterChange[] = [];
		for (const change of this.changes) {
			const {namespace, parameterId} = change;
			if (state[namespace] && parameterId in state[namespace]) {
				overridden.push(change);
				continue;
			}
			included.push(change);
			(merged[namespace] ??= {})[parameterId] = change.value;
			if (change.forceSameValue)
				(mergedForceSameValue[namespace] ??= []).push(parameterId);
		}
		for (const namespace of Object.keys(state))
			merged[namespace] = {...merged[namespace], ...state[namespace]};
		for (const namespace of Object.keys(forceSameValue))
			mergedForceSameValue[namespace] = [
				...(mergedForceSameValue[namespace] ?? []),
				...forceSameValue[namespace],
			];

		return {
			state: merged,
			forceSameValue: mergedForceSameValue,
			included: new ScheduledParameterChanges(included),
			overridden,
		};
	}

	/**
	 * Run the callbacks of the changes along the request sending them.
	 *
	 * @param request The request sending the values.
	 */
	async sendAlong(request: Promise<void>): Promise<void> {
		try {
			await Promise.all([
				request,
				...this.changes.map((change) => change.onSend?.(change.value)),
			]);
		} finally {
			this.changes.forEach((change) => change.onSent?.());
		}
	}
}

/**
 * Time in ms a send waits at most for the end of a pointer gesture (see
 * {@link ParameterChangeScheduler}).
 */
export const MAX_GESTURE_DEFERRAL = 1000;

/**
 * Pending parameter changes of all sessions, sent together.
 *
 * Parameter components schedule their changes here instead of executing them
 * after a timeout of their own (except in accept/reject mode). Every scheduled
 * change restarts a single countdown with its own timeout: the latest change
 * decides how long to wait (like a change with a timeout of 0, which sends
 * right away), also for the changes scheduled before it. When it elapses,
 * all pending changes are sent in one request.
 * Changing several parameters (e.g. typing a text and moving an object)
 * thus results in one computation, and a computation never sends a stale
 * value of another parameter.
 *
 * Any other computation takes the pending changes along: a change with a
 * timeout of 0 sends all pending changes right away, and so does any request
 * of `batchParameterValueUpdate` (e.g. an App Builder action), unless the
 * request restores a state replacing them (e.g. undo, see {@link discard}).
 *
 * The pending changes live here, not in the components: a component which is
 * unmounted while its change is pending (e.g. the container of the parameter
 * closes) does not lose the change.
 *
 * No send starts during a pointer gesture (a pointer pressed anywhere in the
 * window): it waits for the end of the gesture, i.e. for the click it causes,
 * at most {@link MAX_GESTURE_DEFERRAL} ms. Pressing a control blurs the
 * focused one, which may send its change right away (e.g. a text input), and
 * a computation disables the controls: the click on the pressed control
 * would be ignored. Its change is sent together with the change of the
 * blurred control instead.
 */
export class ParameterChangeScheduler {
	readonly #pending = new Map<string, IScheduledParameterChange>();
	#timer: ReturnType<typeof setTimeout> | undefined;
	/** Pointers pressed in a viewport: the countdown waits for their release. */
	readonly #heldPointers = new Set<number>();
	#send: ParameterChangeSender | undefined;
	/** Receives the release events of held pointers (the window). */
	readonly #releaseTarget: EventTarget | undefined;
	/** Notified when the pending changes change (see {@link subscribe}). */
	readonly #listeners = new Set<() => void>();
	/** A send of the changes with a timeout of 0 is queued (see {@link schedule}). */
	#flushQueued = false;
	/** Pointers pressed anywhere in the window (the current pointer gesture). */
	readonly #gesturePointers = new Set<number>();
	/** A send waits for the end of the pointer gesture. */
	#flushAfterGesture = false;
	/** Sends the changes after the gesture, or once it lasted too long. */
	#gestureTimer: ReturnType<typeof setTimeout> | undefined;

	/**
	 * @param send Sends the pending changes, see {@link take}.
	 * @param releaseTarget Receives the release events of held pointers
	 * (`pointerup`, `pointercancel`, `blur`), the window by default.
	 */
	constructor(
		send?: ParameterChangeSender,
		releaseTarget: EventTarget | undefined = typeof window === "undefined"
			? undefined
			: window,
	) {
		this.#send = send;
		this.#releaseTarget = releaseTarget;
		// (observed before any handler of the page, which might stop the event)
		releaseTarget?.addEventListener(
			"pointerdown",
			this.#onGesturePointerDown,
			{capture: true},
		);
		releaseTarget?.addEventListener("pointerup", this.#onGesturePointerUp, {
			capture: true,
		});
		releaseTarget?.addEventListener(
			"pointercancel",
			this.#onGesturePointerUp,
			{capture: true},
		);
		releaseTarget?.addEventListener("blur", this.#onGestureBlur);
	}

	/**
	 * Set the function sending the pending changes (the parameter store
	 * connects itself, it depends on the scheduler).
	 */
	setSend(send: ParameterChangeSender): void {
		this.#send = send;
	}

	/**
	 * Schedule a change: it replaces a pending change of the parameter. A
	 * timeout of 0 sends all pending changes right away (once the current
	 * task scheduled its changes: changes with a timeout of 0 of the same
	 * task are sent in one request; during a pointer gesture once it ended),
	 * otherwise the countdown restarts with the timeout of this change.
	 */
	schedule(change: IScheduledParameterChange): void {
		const key = ParameterChangeScheduler.key(
			change.namespace,
			change.parameterId,
		);
		// the latest change is the last entry (see #restart)
		this.#pending.delete(key);
		this.#pending.set(key, change);
		this.#notify();
		if (change.timeout <= 0) {
			this.#clearTimer();
			if (this.#flushQueued) return;
			this.#flushQueued = true;
			queueMicrotask(() => {
				this.#flushQueued = false;
				this.#flushUnlessGesture();
			});
		} else if (
			this.#heldPointers.size === 0 &&
			!this.#flushQueued &&
			!this.#flushAfterGesture
		)
			this.#restart();
	}

	/**
	 * Listen to changes of the pending changes (e.g. to show that a change
	 * waits to be sent, see {@link hasPendingIn}).
	 *
	 * @returns a function removing the listener.
	 */
	subscribe(listener: () => void): () => void {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}

	/**
	 * A pointer was pressed in a viewport (the user starts a new move, e.g. of
	 * another object controlled by another parameter): the countdown pauses
	 * until the pointer is released, then restarts with the timeout of the
	 * latest pending change. Otherwise a pending change of an earlier move
	 * could be sent in the middle of the new move.
	 *
	 * The scheduler observes the release itself: the press may unmount the
	 * component which reported it (e.g. a click into the scene closes the
	 * container of the parameter), its listeners would miss the release and
	 * the countdown would never restart.
	 */
	holdPointer(pointerId: number): void {
		if (this.#heldPointers.size === 0) this.#observeRelease(true);
		this.#heldPointers.add(pointerId);
		this.#clearTimer();
	}

	/** A pointer pressed in a viewport was released (see {@link holdPointer}). */
	releasePointer(pointerId: number): void {
		if (!this.#heldPointers.delete(pointerId)) return;
		if (this.#heldPointers.size > 0) return;
		this.#observeRelease(false);
		if (this.#pending.size > 0) this.#restart();
	}

	/** Release all held pointers (e.g. the window lost the focus). */
	releaseAllPointers(): void {
		if (this.#heldPointers.size === 0) return;
		this.#heldPointers.clear();
		this.#observeRelease(false);
		if (this.#pending.size > 0) this.#restart();
	}

	/**
	 * Drop the pending change of a parameter. The countdown of the other
	 * pending changes goes on.
	 */
	cancel(namespace: string, parameterId: string): void {
		if (
			!this.#pending.delete(
				ParameterChangeScheduler.key(namespace, parameterId),
			)
		)
			return;
		if (this.#pending.size === 0) this.#clearTimer();
		this.#notify();
	}

	/** Whether a change of the parameter is waiting to be sent. */
	isPending(namespace: string, parameterId: string): boolean {
		return this.#pending.has(
			ParameterChangeScheduler.key(namespace, parameterId),
		);
	}

	/** Whether a change of a parameter of one of the namespaces is waiting. */
	hasPendingIn(namespaces: readonly string[]): boolean {
		for (const change of this.#pending.values())
			if (namespaces.includes(change.namespace)) return true;
		return false;
	}

	/**
	 * The value of the change of the parameter waiting to be sent, undefined
	 * if none is pending (see {@link isPending}).
	 */
	pendingValue(namespace: string, parameterId: string): unknown {
		return this.#pending.get(
			ParameterChangeScheduler.key(namespace, parameterId),
		)?.value;
	}

	/** Number of pending changes. */
	get size(): number {
		return this.#pending.size;
	}

	/** Send all pending changes now. */
	async flush(): Promise<void> {
		this.#clearTimer();
		this.#clearGestureTimer();
		this.#flushAfterGesture = false;
		if (this.#pending.size === 0) return;
		if (!this.#send) {
			Logger.warn("No sender for the pending parameter changes.");
			return;
		}
		try {
			await this.#send();
		} catch (error) {
			Logger.warn("Sending the pending parameter changes failed.", error);
		}
	}

	/**
	 * Take all pending changes to send them with a request: the countdown
	 * stops.
	 */
	take(): ScheduledParameterChanges {
		this.#clearTimer();
		this.#clearGestureTimer();
		this.#flushAfterGesture = false;
		const changes = [...this.#pending.values()];
		this.#pending.clear();
		if (changes.length > 0) this.#notify();

		return new ScheduledParameterChanges(changes);
	}

	/**
	 * Drop pending changes without sending them, because a restored state
	 * replaces them (e.g. undo, a model state). The countdown of the other
	 * pending changes goes on.
	 *
	 * @param namespaces The namespaces whose changes are dropped, all if
	 * undefined.
	 */
	discard(namespaces?: string[]): void {
		const discarded: IScheduledParameterChange[] = [];
		for (const [key, change] of this.#pending) {
			if (namespaces && !namespaces.includes(change.namespace)) continue;
			this.#pending.delete(key);
			discarded.push(change);
		}
		if (this.#pending.size === 0) {
			this.#clearTimer();
			this.#clearGestureTimer();
			this.#flushAfterGesture = false;
		}
		if (discarded.length > 0) this.#notify();
		discarded.forEach((change) => change.onDiscard?.());
	}

	/** Drop all pending changes and held pointers (tests). */
	reset(): void {
		this.#clearTimer();
		this.#clearGestureTimer();
		this.#flushAfterGesture = false;
		this.#gesturePointers.clear();
		this.#pending.clear();
		this.#heldPointers.clear();
		this.#observeRelease(false);
		this.#notify();
	}

	#notify(): void {
		this.#listeners.forEach((listener) => listener());
	}

	readonly #onPointerRelease = (event: Event) =>
		this.releasePointer((event as PointerEvent).pointerId);

	readonly #onBlur = () => this.releaseAllPointers();

	/** Add or remove the listeners for the release of held pointers. */
	#observeRelease(observe: boolean): void {
		const target = this.#releaseTarget;
		if (!target) return;
		const method = observe ? "addEventListener" : "removeEventListener";
		// the pointer may be released outside of the viewport
		target[method]("pointerup", this.#onPointerRelease, {capture: true});
		target[method]("pointercancel", this.#onPointerRelease, {
			capture: true,
		});
		target[method]("blur", this.#onBlur);
	}

	/**
	 * Restart the countdown with the timeout of the latest pending change
	 * (the last entry, see {@link schedule}).
	 */
	#restart(): void {
		this.#clearTimer();
		const timeout = [...this.#pending.values()].at(-1)?.timeout ?? 0;
		this.#timer = setTimeout(() => {
			this.#timer = undefined;
			this.#flushUnlessGesture();
		}, timeout);
	}

	#clearTimer(): void {
		if (this.#timer === undefined) return;
		clearTimeout(this.#timer);
		this.#timer = undefined;
	}

	/** Send the pending changes now, or at the end of the pointer gesture. */
	#flushUnlessGesture(): void {
		if (this.#gesturePointers.size === 0) {
			void this.flush();
			return;
		}
		if (this.#flushAfterGesture) return;
		this.#flushAfterGesture = true;
		// a release which is never observed (e.g. outside of the window) must
		// not hold the changes back
		this.#gestureTimer = setTimeout(
			() => void this.flush(),
			MAX_GESTURE_DEFERRAL,
		);
	}

	readonly #onGesturePointerDown = (event: Event) =>
		this.#gesturePointers.add((event as PointerEvent).pointerId);

	readonly #onGesturePointerUp = (event: Event) => {
		if (!this.#gesturePointers.delete((event as PointerEvent).pointerId))
			return;
		if (this.#gesturePointers.size === 0) this.#endGesture();
	};

	readonly #onGestureBlur = () => {
		if (this.#gesturePointers.size === 0) return;
		this.#gesturePointers.clear();
		this.#endGesture();
	};

	/**
	 * The pointer gesture ended: a send waiting for it starts after the
	 * click caused by the gesture (dispatched after the release), which may
	 * schedule a change of its own.
	 */
	#endGesture(): void {
		if (!this.#flushAfterGesture) return;
		this.#clearGestureTimer();
		this.#gestureTimer = setTimeout(() => void this.flush(), 0);
	}

	#clearGestureTimer(): void {
		if (this.#gestureTimer === undefined) return;
		clearTimeout(this.#gestureTimer);
		this.#gestureTimer = undefined;
	}

	private static key(namespace: string, parameterId: string): string {
		return `${namespace}/${parameterId}`;
	}
}

/**
 * The scheduler of the application. The parameter store connects itself as
 * the sender (see `batchParameterValueUpdate`).
 */
export const parameterChangeScheduler = new ParameterChangeScheduler();
