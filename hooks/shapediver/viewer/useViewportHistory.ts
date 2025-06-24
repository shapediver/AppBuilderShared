import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {useCallback, useState} from "react";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook for managing viewport history (undo/redo functionality).
 * Uses session's built-in navigation methods for history management.
 */
export function useViewportHistory() {
	const [isLoading, setIsLoading] = useState(false);

	const {
		parameterStores,
		goBack: storeGoBack,
		goForward: storeGoForward,
		canGoBack: storeCanGoBack,
		canGoForward: storeCanGoForward,
	} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			parameterStores: state.parameterStores,
			goBack: state.goBack,
			goForward: state.goForward,
			canGoBack: state.canGoBack,
			canGoForward: state.canGoForward,
		})),
	);

	const {sessions} = useShapeDiverStoreSession(
		useShallow((state) => ({
			sessions: state.sessions,
		})),
	);

	// Auto-detect the primary session namespace from parameterStores
	const namespace = Object.keys(parameterStores)[0] || "";

	// Check if the session is ready
	const sessionReady = Boolean(namespace && sessions[namespace]);

	// Use session navigation capabilities
	const canGoBack = storeCanGoBack();
	const canGoForward = storeCanGoForward();

	/**
	 * Go back in session history
	 */
	const goBack = useCallback(async () => {
		if (!canGoBack || isLoading) return;

		setIsLoading(true);
		try {
			await storeGoBack();
		} catch (error) {
			console.error("Error going back in history:", error);
		} finally {
			setIsLoading(false);
		}
	}, [canGoBack, isLoading]);

	/**
	 * Go forward in session history
	 */
	const goForward = useCallback(async () => {
		if (!canGoForward || isLoading) return;

		setIsLoading(true);
		try {
			await storeGoForward();
		} catch (error) {
			console.error("Error going forward in history:", error);
		} finally {
			setIsLoading(false);
		}
	}, [canGoForward, isLoading]);

	return {
		namespace,
		canGoBack,
		canGoForward,
		goBack,
		goForward,
		isLoading,
		sessionReady,
	};
}
