import {applyOverrides} from "@AppBuilderLib/lib/mergeOverrides";
import {useMemo} from "react";
import {IShapeDiverParameter} from "../config/parameter";
import {PropsParameter} from "../config/propsParameter";
import {useShapeDiverStoreParameters} from "./useShapeDiverStoreParameters";

/**
 * Hook providing a shortcut to abstracted parameters managed by {@link useShapeDiverStoreParameters}.
 * CAUTION: Use this hook only if you are sure that the parameter is already defined in the store.
 * In case the parameter might not be defined yet in the store, use {@link useParameterStateless} instead.
 *
 * @see {@link IShapeDiverParameter<T>}
 *
 * @returns
 * @param props<PropsParameter>
 */
export function useParameter<T>(props: PropsParameter) {
	const {namespace, parameterId} = props;
	// Select the parameter store first and subscribe to it outside of the
	// selector: hooks must not be called inside a store selector.
	const parameterStore = useShapeDiverStoreParameters((state) =>
		state.getParameter(namespace, parameterId)!,
	);
	const parameter = parameterStore(
		(state) => state as IShapeDiverParameter<T>,
	);

	const memoizedParameter = useMemo(() => {
		return {
			...parameter,
			definition: applyOverrides(parameter.definition, props.overrides),
		};
	}, [parameter, props.overrides]);

	return memoizedParameter;
}
