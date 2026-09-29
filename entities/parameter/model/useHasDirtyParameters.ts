import {useCallback, useSyncExternalStore} from "react";
import {useShallow} from "zustand/react/shallow";
import type {
	IParameterStore,
	IShapeDiverStoreParameters,
} from "../config/shapediverStoreParameters";
import {useShapeDiverStoreParameters} from "./useShapeDiverStoreParameters";

function parameterStoresForNamespace(
	namespace: string,
	parameterStores: IShapeDiverStoreParameters["parameterStores"],
	sessionDependency: IShapeDiverStoreParameters["sessionDependency"],
): IParameterStore[] {
	const sessionIds = new Set<string>([
		namespace,
		...(sessionDependency[namespace] ?? []),
	]);
	return [...sessionIds].flatMap((sessionId) =>
		Object.values(parameterStores[sessionId] ?? {}),
	);
}

/** Whether any parameter uiValue in the namespace differs from its commit value. */
export function useHasDirtyParameters(namespace: string): boolean {
	const stores = useShapeDiverStoreParameters(
		useShallow((state) =>
			parameterStoresForNamespace(
				namespace,
				state.parameterStores,
				state.sessionDependency,
			),
		),
	);

	const subscribe = useCallback(
		(onStoreChange: () => void) => {
			const unsubscribers = stores.map((store) =>
				store.subscribe(onStoreChange),
			);
			return () => {
				unsubscribers.forEach((unsubscribe) => unsubscribe());
			};
		},
		[stores],
	);

	return useSyncExternalStore(subscribe, () =>
		stores.some((store) => store.getState().state.dirty),
	);
}
