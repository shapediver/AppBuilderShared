import {hasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/lib/hasPendingParameterChanges";
import {useCallback} from "react";
import {useHasDirtyParameters} from "./useHasDirtyParameters";
import {useShapeDiverStoreParameters} from "./useShapeDiverStoreParameters";

/**
 * Whether action and export buttons should wait.
 * True when parameter changes are queued for accept or reject, or when a
 * parameter uiValue has not been committed yet.
 */
export const useHasPendingParameterChanges = (namespace: string) => {
	const pending = useShapeDiverStoreParameters(
		useCallback(
			(state) => hasPendingParameterChanges(namespace, state),
			[namespace],
		),
	);
	const dirty = useHasDirtyParameters(namespace);

	return pending || dirty;
};
