import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {PropsExport} from "@AppBuilderLib/entities/export/config/propsExport";
import {IShapeDiverExport} from "../config/export";
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
			const exportStore = state.getExport(namespace, exportId);

			return exportStore
				? exportStore((state) => state as IShapeDiverExport)
				: undefined;
		}),
	);

	const memoizedParameter = useMemo(() => {
		return parameter
			? {
					...parameter,
					definition: {...parameter.definition, ...props.overrides},
				}
			: undefined;
	}, [parameter, props.overrides]);

	return memoizedParameter;
}
