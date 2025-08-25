import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IShapeDiverParameter} from "@AppBuilderShared/types/shapediver/parameter";
import {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook providing a shortcut to multiple abstracted parameters managed by {@link useShapeDiverStoreParameters}.
 * CAUTION: Use this hook only if you are sure that all parameters are already defined in the store.
 * In case some parameters might not be defined yet in the store, use {@link useParametersStateless} instead.
 *
 * @see {@link IShapeDiverParameter<T>}
 *
 * @param parameterProps Array of parameter props
 * @returns Array of parameters in the same order as input
 */
export function useParameters<T>(props: PropsParameter[]) {
	const parameters = useShapeDiverStoreParameters(
		useShallow((state) => {
			return props.map((prop) => {
				const parameter = state.getParameter(
					prop.namespace,
					prop.parameterId,
				)!((state) => state as IShapeDiverParameter<T>);
				return {parameter, overrides: prop.overrides};
			});
		}),
	);

	return useMemo(() => {
		return parameters.map((p) => {
			return {
				...p.parameter,
				definition: {...p.parameter.definition, ...p.overrides},
			};
		});
	}, [parameters]);
}
