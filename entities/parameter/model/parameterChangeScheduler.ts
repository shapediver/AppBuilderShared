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
 * Pending parameter changes of all sessions, sent together.
 *
 * Parameter components schedule their changes here instead of executing them
 * after a timeout of their own (except in accept/reject mode). Every scheduled
 * change restarts a single countdown with the longest timeout of the pending
 * changes. When it elapses, all pending changes are sent in one request.
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
 */
export class ParameterChangeScheduler {
	readonly #pending = new Map<string, IScheduledParameterChange>();
	#timer: ReturnType<typeof setTimeout> | undefined;
	/** Pointers pressed in a viewport: the countdown waits for their release. */
	readonly #heldPointers = new Set<number>();
	#send: ParameterChangeSender | undefined;
	/** Receives the release events of held pointers (the window). */
	readonly #releaseTarget: EventTarget | undefined;

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
	 * timeout of 0 sends all pending changes right away, otherwise the
	 * countdown restarts with the longest timeout of all pending changes.
	 */
	schedule(change: IScheduledParameterChange): void {
		this.#pending.set(
			ParameterChangeScheduler.key(change.namespace, change.parameterId),
			change,
		);
		if (change.timeout <= 0) void this.flush();
		else if (this.#heldPointers.size === 0) this.#restart();
	}

	/**
	 * A pointer was pressed in a viewport (the user starts a new move, e.g. of
	 * another object controlled by another parameter): the countdown pauses
	 * until the pointer is released, then restarts with the longest timeout of
	 * the pending changes. Otherwise a pending change of an earlier move could
	 * be sent in the middle of the new move.
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
		this.#pending.delete(
			ParameterChangeScheduler.key(namespace, parameterId),
		);
		if (this.#pending.size === 0) this.#clearTimer();
	}

	/** Whether a change of the parameter is waiting to be sent. */
	isPending(namespace: string, parameterId: string): boolean {
		return this.#pending.has(
			ParameterChangeScheduler.key(namespace, parameterId),
		);
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
		const changes = [...this.#pending.values()];
		this.#pending.clear();

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
		if (this.#pending.size === 0) this.#clearTimer();
		discarded.forEach((change) => change.onDiscard?.());
	}

	/** Drop all pending changes and held pointers (tests). */
	reset(): void {
		this.#clearTimer();
		this.#pending.clear();
		this.#heldPointers.clear();
		this.#observeRelease(false);
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

	#restart(): void {
		this.#clearTimer();
		const timeout = Math.max(
			...[...this.#pending.values()].map((change) => change.timeout),
		);
		this.#timer = setTimeout(() => {
			this.#timer = undefined;
			void this.flush();
		}, timeout);
	}

	#clearTimer(): void {
		if (this.#timer === undefined) return;
		clearTimeout(this.#timer);
		this.#timer = undefined;
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
