import {restoreParameterHistory} from "@AppBuilderLib/entities/parameter/lib/undoRedoParameters";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useCallback} from "react";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook for managing viewport history (undo/redo functionality).
 * Restores parameter-store history (same as executeActions), not `window.history`.
 */
export function useViewportHistory() {
	const {historyEntries, historyIndex} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			historyEntries: state.history,
			historyIndex: state.historyIndex,
		})),
	);

	const canGoBack = historyIndex > 0;
	const canGoForward = historyIndex < historyEntries.length - 1;

	const goBack = useCallback(async () => {
		await restoreParameterHistory(-1);
	}, []);

	const goForward = useCallback(async () => {
		await restoreParameterHistory(1);
	}, []);

	return {
		canGoBack,
		canGoForward,
		goBack,
		goForward,
	};
}
