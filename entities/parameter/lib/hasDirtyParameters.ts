import type {IShapeDiverStoreParameters} from "../config/shapediverStoreParameters";
import {useShapeDiverStoreParameters} from "../model/useShapeDiverStoreParameters";

/**
 * Whether any parameter of the namespace has a uiValue that has not been
 * committed yet. Includes the namespace itself and its session dependencies.
 */
export function hasDirtyParameters(
	namespace: string,
	state: IShapeDiverStoreParameters = useShapeDiverStoreParameters.getState(),
): boolean {
	const sessionIds = new Set<string>([
		namespace,
		...(state.sessionDependency[namespace] ?? []),
	]);

	for (const sessionId of sessionIds) {
		const stores = state.parameterStores[sessionId];
		if (!stores) continue;
		for (const store of Object.values(stores)) {
			if (store.getState().state.dirty) return true;
		}
	}

	return false;
}
