import { ShapeDiverResponseParameter } from "@shapediver/api.geometry-api-dto-v2";
import { useShapeDiverStoreParameters } from "../../../store/useShapeDiverStoreParameters";
import { PropsParameter } from "../../../types/components/shapediver/propsParameter";

/**
 * Hook providing a shortcut to create parameter props for the {@link ParametersAndExportsAccordionComponent} 
 * component, for all parameters of one or several sessions, using an optional filter.
 * @param namespace 
 * @param filter optional filter for parameter definitions
 * @returns 
 */
export function useSessionPropsParameter(namespace: string | string[], filter?: (param: ShapeDiverResponseParameter) => boolean) : PropsParameter[] {
	
	const _filter = filter || (() => true); 

	const propsParameters = useShapeDiverStoreParameters(state => (Array.isArray(namespace) ? namespace : [namespace])
		.flatMap(namespace => Object
			.values(state.getParameters(namespace))
			.filter(store => _filter(store.getState().definition))
			.map(store => { 
				const pstate = store.getState();
				
				return { namespace, parameterId: pstate.definition.id, acceptRejectMode: pstate.acceptRejectMode}; 
			})
		)
	); // <-- TODO SS-8052 review how to avoid unnecessary re-renders

	return propsParameters;
}
