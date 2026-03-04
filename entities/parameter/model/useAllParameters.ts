import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook providing a shortcut to abstracted parameters managed by {@link useShapeDiverStoreParameters}.
 * Gets parameter stores for all parameters of a given namespace.
 *
 * @see {@link IShapeDiverParameter<T>}
 *
 * @param namespace q
 * @returns
 */
export function useAllParameters(namespace: string) {
	const {getParameters} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			getParameters: state.getParameters,
		})),
	);

	const paramStores = getParameters(namespace);

	return {
		parameters: paramStores,
	};
}
