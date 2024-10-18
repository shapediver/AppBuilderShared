import { ShapeDiverResponseExportDefinition } from "@shapediver/api.geometry-api-dto-v2";
import { useShapeDiverStoreParameters } from "../../../store/useShapeDiverStoreParameters";
import { PropsExport } from "../../../types/components/shapediver/propsExport";

/**
 * Hook providing a shortcut to create export props for the {@link ParametersAndExportsAccordionComponent}
 * component, for all exports of one or several sessions, using an optional filter. 
 * @param namespace 
 * @param filter optional filter for export definitions
 * @returns 
 */
export function useSessionPropsExport(namespace: string | string[], filter?: (param: ShapeDiverResponseExportDefinition) => boolean) : PropsExport[] {
	
	const _filter = filter || (() => true); 

	const propsExports = useShapeDiverStoreParameters(state => (Array.isArray(namespace) ? namespace : [namespace])
		.flatMap(namespace => Object
			.values(state.getExports(namespace))
			.filter(store => _filter(store.getState().definition))
			.map(store => { return {namespace, exportId: store.getState().definition.id}; })
		)
	); // <-- TODO SS-8052 review how to avoid unnecessary re-renders

	return propsExports;
}
