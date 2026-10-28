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

	constructor(flush: AutomaticSceneUpdateFlush) {
		this.#flush = flush;
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
		if (this.#heldPointers.size === 0) this.#restart();
	}

	/**
	 * A pointer was pressed in a viewport (the user starts a new move, e.g. of
	 * another object controlled by another parameter): the countdown pauses
	 * until the pointer is released, then restarts with the longest timeout of
	 * the pending values. Otherwise a pending value of an earlier move could be
	 * sent in the middle of the new move.
	 */
	holdPointer(pointerId: number): void {
		this.#heldPointers.add(pointerId);
		this.#clearTimer();
	}

	/** A pointer pressed in a viewport was released (see {@link holdPointer}). */
	releasePointer(pointerId: number): void {
		if (!this.#heldPointers.delete(pointerId)) return;
		if (this.#heldPointers.size === 0 && this.#pending.size > 0)
			this.#restart();
	}

	/** Release all held pointers (e.g. the window lost the focus). */
	releaseAllPointers(): void {
		if (this.#heldPointers.size === 0) return;
		this.#heldPointers.clear();
		if (this.#pending.size > 0) this.#restart();
	}

	/**
	 * Drop the pending value of a parameter. The countdown of the other
	 * pending values goes on.
	 */
	cancel(namespace: string, parameterId: string): void {
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
		try {
			await this.#flush(state);
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
	}

	#restart(): void {
		this.#clearTimer();
		const timeout = Math.max(
			...[...this.#pending.values()].map((update) => update.timeout),
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

/** The scheduler of the application: sends through the parameter store. */
export const automaticSceneUpdateScheduler = new AutomaticSceneUpdateScheduler(
	(state) =>
		useShapeDiverStoreParameters
			.getState()
			.batchParameterValueUpdate(state),
);
