import { useShallow } from "zustand/react/shallow";
import { useShapeDiverStoreParameters } from "../../../store/useShapeDiverStoreParameters";
import { IShapeDiverParameter } from "../../../types/shapediver/parameter";

/**
 * Hook providing a shortcut to abstracted parameters managed by {@link useShapeDiverStoreParameters}. 
 * Gets parameter stores for all parameters of a given namespace.
 * 
 * @see {@link IShapeDiverParameter<T>}
 * 
 * @param namespace 
 * @returns 
 */
export function useAllParameters(namespace: string) {
	
	const {getParameters, getParameter} = useShapeDiverStoreParameters(useShallow(state => ({
		getParameters: state.getParameters, 
		getParameter: state.getParameter
	})));

	const paramStores = getParameters(namespace);

	const paramStoresStateless = Object.values(paramStores).reduce((acc, store) => {
		const pstate = store.getState();
		acc[pstate.definition.id] = pstate;
		return acc;
	}, {} as { [key: string]: IShapeDiverParameter<any> });

	return {
		parameters: paramStoresStateless,
	}
}
