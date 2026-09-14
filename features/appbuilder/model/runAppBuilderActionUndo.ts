import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";

export async function restoreParameterHistory(delta: -1 | 1): Promise<void> {
	const {history, historyIndex, restoreHistoryStateFromIndex} =
		useShapeDiverStoreParameters.getState();
	const nextIndex = historyIndex + delta;
	if (nextIndex < 0 || nextIndex >= history.length) return;
	await restoreHistoryStateFromIndex(nextIndex);
}

/** Restore the previous parameter-history entry. */
export async function runAppBuilderActionUndo(): Promise<void> {
	await restoreParameterHistory(-1);
}
