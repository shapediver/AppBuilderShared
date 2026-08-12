import {useCallback} from "react";
import {useShapeDiverStoreParameters} from "./useShapeDiverStoreParameters";

/** Whether the namespace has parameter changes awaiting accept or reject. */
export const useHasPendingParameterChanges = (namespace: string) =>
	useShapeDiverStoreParameters(
		useCallback(
			(state) => {
				const sessionIds = state.sessionDependency[namespace] ?? [];
				return sessionIds.some(
					(sessionId) =>
						Object.keys(
							state.parameterChanges[sessionId]?.values ?? {},
						).length > 0,
				);
			},
			[namespace],
		),
	);
