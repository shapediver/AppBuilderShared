import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {IShapeDiverParameter} from "@AppBuilderShared/types/shapediver/parameter";

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
