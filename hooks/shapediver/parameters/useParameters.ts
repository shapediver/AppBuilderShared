import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IShapeDiverParameter} from "@AppBuilderShared/types/shapediver/parameter";
import {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";

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
