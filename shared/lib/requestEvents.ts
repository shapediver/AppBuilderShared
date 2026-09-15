export type RequestEventPhase = "start" | "end" | "error";

export type RequestEvent<TIdentity extends object> = TIdentity & {
	phase: RequestEventPhase;
};

/**
 * In-process start/end/error bus for store-backed requests that have no
 * corresponding viewer task identity (exports, and similar later).
 */
export function createRequestEventBus<TIdentity extends object>() {
	type Event = RequestEvent<TIdentity>;
	const listeners = new Set<(event: Event) => void>();

	const emit = (event: Event) => {
		listeners.forEach((listener) => listener(event));
	};

	return {
		addListener(listener: (event: Event) => void): () => void {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		emit,
		async wrap<T>(identity: TIdentity, run: () => Promise<T>): Promise<T> {
			emit({...identity, phase: "start"});
			try {
				const result = await run();
				emit({...identity, phase: "end"});
				return result;
			} catch (error) {
				emit({...identity, phase: "error"});
				throw error;
			}
		},
	};
}
