import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {IShapeDiverExport} from "@AppBuilderShared/types/shapediver/export";
import {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook providing a shortcut to abstracted exports managed by {@link useShapeDiverStoreParameters}.
 *
 * @see {@link PropsExport}
 *
 * @param namespace
 * @param exportId Id, name, or displayname of the export
 * @returns
 */
export function useExport(props: PropsExport) {
	const {namespace, exportId} = props;
	const parameter = useShapeDiverStoreParameters(
		useShallow((state) => {
			const parameter = state.getExport(namespace, exportId)!(
				(state) => state as IShapeDiverExport,
			);
			return parameter;
		}),
	);

	const memoizedParameter = useMemo(() => {
		return {
			...parameter,
			definition: {...parameter.definition, ...props.overrides},
		};
	}, [parameter, props.overrides]);

	return memoizedParameter;
}
