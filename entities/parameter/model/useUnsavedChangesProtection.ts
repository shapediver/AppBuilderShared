import {useEffect} from "react";
import {useShapeDiverStoreParameters} from "./useShapeDiverStoreParameters";

/**
 * Hook that installs a `beforeunload` handler preventing accidental loss of
 * unsaved parameter changes (browser crash, tab close, navigation).
 *
 * The handler reads the `unsavedChanges` flag of the current parameter history
 * entry directly from the store, so it stays in sync with parameter changes
 * and model state / parameter JSON creation or import without re-subscribing
 * on every state update.
 */
export function useUnsavedChangesProtection() {
	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			const {history, historyIndex} =
				useShapeDiverStoreParameters.getState();
			const current = history[historyIndex];
			if (current?.unsavedChanges) {
				event.preventDefault();
				// Required for legacy browsers to trigger the confirmation prompt
				event.returnValue = "";
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, []);
}
