import {PropsExport} from "@AppBuilderLib/entities/export/config/propsExport";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import {IShapeDiverExport} from "../config/export";

/**
 * Hook providing a shortcut to multiple abstracted exports managed by {@link useShapeDiverStoreParameters}.
 *
 * @see {@link PropsExports}
 *
 * @param props Configuration containing namespace and array of export specifications
 * @returns Array of exports with the same order as provided in props.exports
 */
export function useExports(props: PropsExport[]) {
	// Select the export state objects only. Their references are stable
	// until the respective export store changes, which allows the shallow
	// comparison to succeed. Creating wrapper objects inside the selector
	// would return a new array on every call and cause an infinite render loop.
	const parameters = useShapeDiverStoreParameters(
		useShallow((state) => {
			return props.map(({exportId, namespace}) => {
				if (!state) return;
				const _parameter = state.getExport(namespace, exportId);
				if (!_parameter) return;
				return _parameter.getState() as IShapeDiverExport;
			});
		}),
	);

	return useMemo(() => {
		return parameters.map((parameter, index) => {
			if (!parameter) return;
			return {
				...parameter,
				definition: {
					...parameter.definition,
					...props[index]?.overrides,
				},
			};
		});
	}, [parameters, props]);
}
