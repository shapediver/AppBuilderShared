import {hasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/lib/hasPendingParameterChanges";
import {useCallback} from "react";
import {useShapeDiverStoreParameters} from "./useShapeDiverStoreParameters";

/** Whether the namespace has parameter changes awaiting accept or reject. */
export const useHasPendingParameterChanges = (namespace: string) =>
	useShapeDiverStoreParameters(
		useCallback(
			(state) => hasPendingParameterChanges(namespace, state),
			[namespace],
		),
	);
