import {debugSceneUpdateLog} from "@AppBuilderLib/entities/parameter/lib/debugSceneUpdateLog";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import type {ISessionsHistoryState} from "../config/shapediverStoreParameters";
import {useShapeDiverStoreParameters} from "./useShapeDiverStoreParameters";

/** A parameter value waiting for its automatic scene update. */
export interface IScheduledAutomaticSceneUpdate {
	/** Session namespace of the parameter. */
	namespace: string;
	/** Id of the parameter. */
	parameterId: string;
	/** The value to send. */
	value: string;
	/** The idle timeout of the parameter in ms. */
	timeout: number;
	/**
	 * Called once the value was sent (e.g. to execute delegates); its result
	 * is awaited by the flush.
	 */
	afterSend?: (value: string) => Promise<unknown>;
}

/** Sends the pending values of all namespaces at once. */
export type AutomaticSceneUpdateFlush = (
	state: ISessionsHistoryState,
) => Promise<void>;

/**
 * Pending automatic scene updates of all interaction parameters (gumball,
 * rectangle transform, drawing), sent together.
 *
 * Every scheduled change restarts a single countdown with the longest timeout
 * of the pending parameters. When it elapses, all pending values are sent in
 * one request (`batchParameterValueUpdate`). Moving several objects which are
 * controlled by different parameters thus results in one computation instead
 * of one per parameter, and a move of one object never sends a stale value of
 * another one.
 *
 * The pending values live here, not in the components: a component which is
 * unmounted while its change is pending (e.g. the container of the parameter
 * closes) does not lose the change.
 */
export class AutomaticSceneUpdateScheduler {
	readonly #pending = new Map<string, IScheduledAutomaticSceneUpdate>();
	#timer: ReturnType<typeof setTimeout> | undefined;
	/** Pointers pressed in a viewport: the countdown waits for their release. */
	readonly #heldPointers = new Set<number>();
	readonly #flush: AutomaticSceneUpdateFlush;
	/** Receives the release events of held pointers (the window). */
	readonly #releaseTarget: EventTarget | undefined;

	/**
	 * @param flush Sends the pending values.
	 * @param releaseTarget Receives the release events of held pointers
	 * (`pointerup`, `pointercancel`, `blur`), the window by default.
	 */
	constructor(
		flush: AutomaticSceneUpdateFlush,
		releaseTarget: EventTarget | undefined = typeof window === "undefined"
			? undefined
			: window,
	) {
		this.#flush = flush;
		this.#releaseTarget = releaseTarget;
	}

	/**
	 * Schedule a value: it replaces a pending value of the parameter and
	 * restarts the countdown with the longest timeout of all pending values.
	 */
	schedule(update: IScheduledAutomaticSceneUpdate): void {
		this.#pending.set(
			AutomaticSceneUpdateScheduler.key(
				update.namespace,
				update.parameterId,
			),
			update,
		);
		debugSceneUpdateLog("scheduler.schedule", {
			namespace: update.namespace,
			parameterId: update.parameterId,
			value: update.value,
			timeout: update.timeout,
			heldPointers: this.#heldPointers.size,
		});
		if (this.#heldPointers.size === 0) this.#restart();
	}

	/**
	 * A pointer was pressed in a viewport (the user starts a new move, e.g. of
	 * another object controlled by another parameter): the countdown pauses
	 * until the pointer is released, then restarts with the longest timeout of
	 * the pending values. Otherwise a pending value of an earlier move could be
	 * sent in the middle of the new move.
	 *
	 * The scheduler observes the release itself: the press may unmount the
	 * component which reported it (e.g. a click into the scene closes the
	 * container of the parameter), its listeners would miss the release and
	 * the countdown would never restart.
	 */
	holdPointer(pointerId: number): void {
		if (this.#heldPointers.size === 0) this.#observeRelease(true);
		this.#heldPointers.add(pointerId);
		debugSceneUpdateLog("scheduler.holdPointer", {
			pointerId,
			pending: this.#pending.size,
			countdownRunning: this.#timer !== undefined,
		});
		this.#clearTimer();
	}

	/** A pointer pressed in a viewport was released (see {@link holdPointer}). */
	releasePointer(pointerId: number): void {
		if (!this.#heldPointers.delete(pointerId)) return;
		debugSceneUpdateLog("scheduler.releasePointer", {
			pointerId,
			stillHeld: this.#heldPointers.size,
			pending: this.#pending.size,
		});
		if (this.#heldPointers.size > 0) return;
		this.#observeRelease(false);
		if (this.#pending.size > 0) this.#restart();
	}

	/** Release all held pointers (e.g. the window lost the focus). */
	releaseAllPointers(): void {
		if (this.#heldPointers.size === 0) return;
		debugSceneUpdateLog("scheduler.releaseAllPointers", {
			pending: this.#pending.size,
		});
		this.#heldPointers.clear();
		this.#observeRelease(false);
		if (this.#pending.size > 0) this.#restart();
	}

	/**
	 * Drop the pending value of a parameter. The countdown of the other
	 * pending values goes on.
	 */
	cancel(namespace: string, parameterId: string): void {
		debugSceneUpdateLog("scheduler.cancel", {
			namespace,
			parameterId,
			wasPending: this.isPending(namespace, parameterId),
		});
		this.#pending.delete(
			AutomaticSceneUpdateScheduler.key(namespace, parameterId),
		);
		if (this.#pending.size === 0) this.#clearTimer();
	}

	/** Whether a value of the parameter is waiting to be sent. */
	isPending(namespace: string, parameterId: string): boolean {
		return this.#pending.has(
			AutomaticSceneUpdateScheduler.key(namespace, parameterId),
		);
	}

	/** Number of pending values. */
	get size(): number {
		return this.#pending.size;
	}

	/** Send all pending values now. */
	async flush(): Promise<void> {
		this.#clearTimer();
		if (this.#pending.size === 0) return;
		const updates = [...this.#pending.values()];
		this.#pending.clear();

		const state: ISessionsHistoryState = {};
		for (const {namespace, parameterId, value} of updates) {
			(state[namespace] ??= {})[parameterId] = value;
		}
		debugSceneUpdateLog("scheduler.flush (send)", state);
		try {
			await this.#flush(state);
			debugSceneUpdateLog("scheduler.flush done");
			await Promise.all(
				updates.map((update) => update.afterSend?.(update.value)),
			);
		} catch (error) {
			Logger.warn("Automatic scene update failed.", error);
		}
	}

	/** Drop all pending values (tests). */
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
			...[...this.#pending.values()].map((update) => update.timeout),
		);
		debugSceneUpdateLog("scheduler.countdown start", {
			timeout,
			pending: [...this.#pending.keys()],
		});
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

/** The scheduler of the application: sends through the parameter store. */
export const automaticSceneUpdateScheduler = new AutomaticSceneUpdateScheduler(
	(state) =>
		useShapeDiverStoreParameters
			.getState()
			.batchParameterValueUpdate(state),
);
