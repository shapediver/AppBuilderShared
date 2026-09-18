import type {IShapeDiverStoreParameters} from "../config/shapediverStoreParameters";
import {useShapeDiverStoreParameters} from "../model/useShapeDiverStoreParameters";

/** Whether the namespace has parameter changes awaiting accept or reject. */
export function hasPendingParameterChanges(
	namespace: string,
	state: IShapeDiverStoreParameters = useShapeDiverStoreParameters.getState(),
): boolean {
	const sessionIds = state.sessionDependency[namespace] ?? [];
	return sessionIds.some(
		(sessionId) =>
			Object.keys(state.parameterChanges[sessionId]?.values ?? {})
				.length > 0,
	);
}
