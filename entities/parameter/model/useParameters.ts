import {applyOverrides} from "@AppBuilderLib/lib/mergeOverrides";
import {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import {IShapeDiverParameter} from "../config/parameter";
import {PropsParameter} from "../config/propsParameter";
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
	// Select the parameter state objects only. Their references are stable
	// until the respective parameter store changes, which allows the shallow
	// comparison to succeed. Creating wrapper objects inside the selector
	// would return a new array on every call and cause an infinite render loop.
	const parameters = useShapeDiverStoreParameters(
		useShallow((state) => {
			return props.map(({parameterId, namespace}) => {
				if (!state) return;
				const _parameter = state.getParameter(namespace, parameterId);
				if (!_parameter) return;
				return _parameter.getState() as IShapeDiverParameter<T>;
			});
		}),
	);

	return useMemo(() => {
		return parameters.map((parameter, index) => {
			if (!parameter) return;
			return {
				...parameter,
				definition: applyOverrides(
					parameter.definition,
					props[index]?.overrides,
				),
			};
		});
	}, [parameters, props]);
}
