/**
 * The values an interaction parameter component sent itself (Confirm or an
 * automatic scene update), oldest first. A commit of one of them is an own
 * commit, any other commit (a reset value, Clear, undo, a model state) is
 * foreign.
 *
 * With automatic scene updates the user may keep editing while a sent value
 * executes: a newer value is sent (or scheduled) before the older one is
 * committed. Comparing a commit with the last sent value only would treat the
 * commit of the older value as foreign and drop the newer one.
 */
export class SentValues {
	#values: string[] = [];

	/** Remember a value sent by the component. */
	record(value: string): void {
		this.#values.push(value);
	}

	/** Forget all sent values (e.g. Clear sends a value of its own kind). */
	clear(): void {
		this.#values = [];
	}

	/**
	 * Whether a value was sent by the component and a newer sent value is
	 * still waiting for its commit (the scene shows that newer state).
	 */
	isSuperseded(value: string): boolean {
		const index = this.#values.indexOf(value);
		return index >= 0 && index < this.#values.length - 1;
	}

	/**
	 * Match a commit against the sent values. The oldest matching value is
	 * the committed one (commits arrive in the order of sending, the same
	 * value may be sent again later). An own commit removes the committed
	 * value and all older ones; a foreign commit removes all values.
	 *
	 * @returns `own`: the committed value was sent by the component;
	 * `newerPending`: a newer value sent by the component is still waiting for
	 * its commit (the scene shows that newer state).
	 */
	takeCommit(commitValue: string): {own: boolean; newerPending: boolean} {
		const index = this.#values.indexOf(commitValue);
		if (index < 0) {
			this.#values = [];
			return {own: false, newerPending: false};
		}
		this.#values = this.#values.slice(index + 1);
		return {own: true, newerPending: this.#values.length > 0};
	}
}
