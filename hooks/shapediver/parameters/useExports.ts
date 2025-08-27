import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {IShapeDiverExport} from "@AppBuilderShared/types/shapediver/export";
import {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook providing a shortcut to multiple abstracted exports managed by {@link useShapeDiverStoreParameters}.
 *
 * @see {@link PropsExports}
 *
 * @param props Configuration containing namespace and array of export specifications
 * @returns Array of exports with the same order as provided in props.exports
 */
export function useExports(props: PropsExport[]) {
	const parameters = useShapeDiverStoreParameters(
		useShallow((state) => {
			return props.map(({exportId, namespace, overrides}) => {
				if (!state) return;
				const _parameter = state.getExport(namespace, exportId);
				if (!_parameter) return;
				const parameter = _parameter.getState() as IShapeDiverExport;
				return {parameter, overrides};
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
