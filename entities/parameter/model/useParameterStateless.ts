import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter";
import {useShapeDiverStoreParameters} from "./useShapeDiverStoreParameters";

/**
 * Hook providing a shortcut to abstracted parameters managed by {@link useShapeDiverStoreParameters}.
 *
 * @see {@link IShapeDiverParameter<T>}
 *
 * @param namespace
 * @param parameterId Id, name, or displayname of the parameter
 * @returns
 */
export function useParameterStateless<T>(
	namespace: string,
	parameterId: string,
	type?: string,
) {
	const parametersStore = useShapeDiverStoreParameters();
	const paramStore = parametersStore.getParameter(
		namespace,
		parameterId,
		type,
	);

	return paramStore
		? (paramStore.getState() as IShapeDiverParameter<T>)
		: undefined;
}
