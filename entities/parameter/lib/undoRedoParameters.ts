import {useShapeDiverStoreParameters} from "../model/useShapeDiverStoreParameters";
import {hasPendingParameterChanges} from "./hasPendingParameterChanges";

export type HistoryActionResult = {
	success: boolean;
	message?: string;
};

/**
 * Restore a parameter-history entry by moving the index. Shared by toolbar
 * undo/redo and API callers. Does not use `window.history`.
 */
export async function restoreParameterHistory(delta: -1 | 1): Promise<boolean> {
	const {history, historyIndex, restoreHistoryStateFromIndex} =
		useShapeDiverStoreParameters.getState();
	const nextIndex = historyIndex + delta;
	if (nextIndex < 0 || nextIndex >= history.length) {
		return false;
	}
	await restoreHistoryStateFromIndex(nextIndex);
	return true;
}

export async function undoParameterHistory(
	namespace: string,
): Promise<HistoryActionResult> {
	if (hasPendingParameterChanges(namespace)) {
		return {success: false, message: "Pending parameter changes."};
	}
	const restored = await restoreParameterHistory(-1);
	if (!restored) {
		return {success: false, message: "Nothing to undo."};
	}
	return {success: true};
}

export async function redoParameterHistory(
	namespace: string,
): Promise<HistoryActionResult> {
	if (hasPendingParameterChanges(namespace)) {
		return {success: false, message: "Pending parameter changes."};
	}
	const restored = await restoreParameterHistory(1);
	if (!restored) {
		return {success: false, message: "Nothing to redo."};
	}
	return {success: true};
}
