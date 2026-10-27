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
		this.#restart();
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
