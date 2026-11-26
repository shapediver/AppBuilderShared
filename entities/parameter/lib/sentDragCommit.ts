import {SentValues} from "./sentValues";

/** A value this component sent, with the gestures that were combined into it. */
export type SentDrag<T extends {name: string}> = {
	value: string;
	gestures: T[];
};

/**
 * Match a commit against the drags this component sent.
 *
 * The gesture matrix of a drag replaces the previous `SD_drag_matrix` and is
 * relative to the last executed geometry. A commit therefore drops only the
 * objects named in the sent gestures up to and including the matched value.
 * A newer sent value stays in `remaining` (`newerPending`), and the caller
 * keeps those gestures: the scene already shows them.
 *
 * A foreign commit (anything this component did not send) clears the list.
 */
export const consumeSentDrag = <T extends {name: string}>(
	sentValues: SentValues,
	sentGestures: readonly SentDrag<T>[],
	commitValue: string,
): {
	own: boolean;
	newerPending: boolean;
	consumedNames: string[];
	remaining: SentDrag<T>[];
} => {
	const index = sentGestures.findIndex(
		(entry) => entry.value === commitValue,
	);
	const sent = sentValues.takeCommit(commitValue);
	if (!sent.own) {
		return {
			own: false,
			newerPending: false,
			consumedNames: [],
			remaining: [],
		};
	}
	if (index < 0) {
		return {
			own: true,
			newerPending: sent.newerPending,
			consumedNames: [],
			remaining: [...sentGestures],
		};
	}
	const consumed = sentGestures.slice(0, index + 1);
	return {
		own: true,
		newerPending: sent.newerPending,
		consumedNames: [
			...new Set(
				consumed.flatMap((entry) =>
					entry.gestures.map((gesture) => gesture.name),
				),
			),
		],
		remaining: sentGestures.slice(index + 1),
	};
};

/**
 * What a commit does to a Clear requested while a drag this component sent
 * is still in flight.
 *
 * That drag must stay an own commit. A foreign commit cancels the pending
 * reset, so Clear keeps the sent list until the drag commits. The reset is
 * sent only once the committed value is not already the default: a reset to
 * the current value is dropped, and the drag would then stay.
 */
export const resolveDraggingClearCommit = (input: {
	clearRequested: boolean;
	resetSent: boolean;
	own: boolean;
	newerPending: boolean;
	commitIsDefault: boolean;
}): {
	/** Do not apply this commit's drag. The scene stays cleared. */
	keepClearedScene: boolean;
	/** Send the reset. The committed value is the drag, so it is not a no-op. */
	sendReset: boolean;
	/** The clear is done, or this commit is the reset (or another foreign one). */
	finished: boolean;
} => {
	if (!input.clearRequested)
		return {keepClearedScene: false, sendReset: false, finished: false};
	if (!input.own)
		return {keepClearedScene: false, sendReset: false, finished: true};
	if (input.newerPending || input.resetSent)
		return {keepClearedScene: true, sendReset: false, finished: false};
	if (!input.commitIsDefault)
		return {keepClearedScene: true, sendReset: true, finished: false};
	return {keepClearedScene: true, sendReset: false, finished: true};
};

/**
 * Remove sends that were cancelled before the request.
 *
 * Each cancelled value drops its newest occurrence, so an earlier send of the
 * same value that is already in flight stays.
 */
export const dropCancelledSends = <T extends {value: string}>(
	sentValues: SentValues,
	sentGestures: readonly T[],
	cancelled: readonly string[],
): T[] => {
	sentValues.dropNewestOccurrences(cancelled);
	const pending = [...cancelled];
	const remaining = [...sentGestures];
	for (
		let index = remaining.length - 1;
		index >= 0 && pending.length > 0;
		index--
	) {
		const at = pending.lastIndexOf(remaining[index].value);
		if (at < 0) continue;
		pending.splice(at, 1);
		remaining.splice(index, 1);
	}
	return remaining;
};
