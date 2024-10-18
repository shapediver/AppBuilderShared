import { useMemo } from "react";
import { useShapeDiverStoreParameters } from "../../../store/useShapeDiverStoreParameters";
import { PropsExport } from "../../../types/components/shapediver/propsExport";
import { IShapeDiverExport } from "../../../types/shapediver/export";

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
	
	const { namespace, exportId } = props;
	const parametersStore = useShapeDiverStoreParameters();
	const parameter = parametersStore.getExport(namespace, exportId)!(state => state as IShapeDiverExport);
	
	const memoizedParameter = useMemo(() => {
		return {
			...parameter,
			definition: { ...parameter.definition, ...props.overrides }
		};
	}, [parameter, props.overrides]);

	return memoizedParameter;
}
