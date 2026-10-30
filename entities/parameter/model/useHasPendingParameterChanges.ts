import {
	hasPendingParameterChanges,
	parameterChangeNamespaces,
} from "@AppBuilderLib/entities/parameter/lib/hasPendingParameterChanges";
import {useCallback, useSyncExternalStore} from "react";
import {useShallow} from "zustand/react/shallow";
import {parameterChangeScheduler} from "./parameterChangeScheduler";
import {useHasDirtyParameters} from "./useHasDirtyParameters";
import {useShapeDiverStoreParameters} from "./useShapeDiverStoreParameters";

/**
 * Whether action and export buttons should wait.
 * True when parameter changes are queued for accept or reject, or when a
 * parameter uiValue has not been committed yet.
 *
 * @param includeScheduled Whether a change of a parameter component waiting
 * to be sent (see `parameterChangeScheduler`) counts as well, false for
 * actions which replace the pending changes (e.g. undo, an import) or send
 * them along (see `batchParameterValueUpdate`).
 */
export const useHasPendingParameterChanges = (
	namespace: string,
	includeScheduled = true,
) => {
	const pending = useShapeDiverStoreParameters(
		useCallback(
			(state) => hasPendingParameterChanges(namespace, state),
			[namespace],
		),
	);
	const dirty = useHasDirtyParameters(namespace);
	const namespaces = useShapeDiverStoreParameters(
		useShallow((state) => parameterChangeNamespaces(namespace, state)),
	);
	const scheduled = useSyncExternalStore(
		useCallback(
			(onChange: () => void) =>
				parameterChangeScheduler.subscribe(onChange),
			[],
		),
		() =>
			includeScheduled &&
			parameterChangeScheduler.hasPendingIn(namespaces),
	);

	return pending || dirty || scheduled;
};
