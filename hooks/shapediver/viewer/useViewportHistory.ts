import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useCallback} from "react";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook for managing viewport history (undo/redo functionality).
 * Uses session's built-in navigation methods for history management.
 */
export function useViewportHistory() {
	const {historyEntries, historyIndex} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			parameterStores: state.parameterStores,
			historyEntries: state.history,
			historyIndex: state.historyIndex,
		})),
	);

	// Use history navigation capabilities
	const canGoBack = historyIndex > 0;
	const canGoForward = historyIndex < historyEntries.length - 1;

	/**
	 * Go back in session history
	 */
	const goBack = useCallback(() => {
		if (!canGoBack) return;

		history.back();
	}, [canGoBack, historyIndex]);

	/**
	 * Go forward in session history
	 */
	const goForward = useCallback(() => {
		if (!canGoForward) return;

		history.forward();
	}, [canGoForward, historyIndex]);

	return {
		canGoBack,
		canGoForward,
		goBack,
		goForward,
	};
}
