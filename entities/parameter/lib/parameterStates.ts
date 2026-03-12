import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {useShapeDiverStoreParameters} from "../model/useShapeDiverStoreParameters";

/**
 * Get the current parameter states for a given namespace.
 * @param namespace
 * @returns
 */
export function getParameterStates(
	namespace: string,
): IShapeDiverParameter<any>[] {
	const parameterStores = useShapeDiverStoreParameters
		.getState()
		.getParameters(namespace);
	return Object.values(parameterStores).map((paramStore) =>
		paramStore.getState(),
	);
}
