import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useCallback, useState} from "react";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook for managing viewport history (undo/redo functionality).
 * Uses session's built-in navigation methods for history management.
 */
export function useViewportHistory() {
	const [isLoading, setIsLoading] = useState(false);

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
		if (!canGoBack || isLoading) return;

		setIsLoading(true);
		try {
			history.back();
		} catch (error) {
			console.error("Error going back in history:", error);
		} finally {
			setIsLoading(false);
		}
	}, [canGoBack, historyIndex]);

	/**
	 * Go forward in session history
	 */
	const goForward = useCallback(() => {
		if (!canGoForward || isLoading) return;

		setIsLoading(true);
		try {
			history.forward();
		} catch (error) {
			console.error("Error going forward in history:", error);
		} finally {
			setIsLoading(false);
		}
	}, [canGoForward, historyIndex]);

	return {
		canGoBack,
		canGoForward,
		goBack,
		goForward,
		isLoading,
	};
}
