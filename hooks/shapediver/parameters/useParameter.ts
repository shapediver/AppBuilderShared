import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IShapeDiverParameter} from "@AppBuilderShared/types/shapediver/parameter";
import {useMemo} from "react";

/**
 * Hook providing a shortcut to abstracted parameters managed by {@link useShapeDiverStoreParameters}.
 * CAUTION: Use this hook only if you are sure that the parameter is already defined in the store.
 * In case the parameter might not be defined yet in the store, use {@link useParameterStateless} instead.
 *
 * @see {@link IShapeDiverParameter<T>}
 *
 * @param namespace
 * @param parameterId Id, name, or displayname of the parameter
 * @returns
 */
export function useParameter<T>(props: PropsParameter) {
	const {namespace, parameterId} = props;
	const getParameter = useShapeDiverStoreParameters(
		(state) => state.getParameter,
	);
	const parameter = getParameter(namespace, parameterId)!(
		(state) => state as IShapeDiverParameter<T>,
	);

	const memoizedParameter = useMemo(() => {
		return {
			...parameter,
			definition: {...parameter.definition, ...props.overrides},
		};
	}, [parameter, props.overrides]);

	return memoizedParameter;
}
