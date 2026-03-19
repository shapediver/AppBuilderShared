import {
	IShapeDiverParameter,
	PropsParameter,
} from "@AppBuilderLib/entities/parameter";
import {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import {useShapeDiverStoreParameters} from "./useShapeDiverStoreParameters";

/**
 * Hook providing a shortcut to multiple abstracted parameters managed by {@link useShapeDiverStoreParameters}.
 *
 * @see {@link IShapeDiverParameter<T>}
 *
 * @param parameterProps Array of parameter props
 * @returns Array of parameters in the same order as input
 */
export function useParameters<T>(props: PropsParameter[]) {
	const parameters = useShapeDiverStoreParameters(
		useShallow((state) => {
			return props.map(({parameterId, namespace, overrides}) => {
				if (!state) return;
				const _parameter = state.getParameter(namespace, parameterId);
				if (!_parameter) return;
				const parameter =
					_parameter.getState() as IShapeDiverParameter<T>;
				return {parameter, overrides: overrides};
			});
		}),
	);

	return useMemo(() => {
		return parameters.map((p) => {
			if (!p) return;
			return {
				...p.parameter,
				definition: {...p.parameter.definition, ...p.overrides},
			};
		});
	}, [parameters]);
}
