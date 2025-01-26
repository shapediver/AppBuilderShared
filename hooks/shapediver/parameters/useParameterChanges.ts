import { useShapeDiverStoreParameters } from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import { PropsParameter } from "@AppBuilderShared/types/components/shapediver/propsParameter";
import { IParameterChanges } from "@AppBuilderShared/types/store/shapediverStoreParameters";

/**
 * Get parameter change objects for all sessions used by the given parameters.
 * @see {@link IParameterChanges}
 *
 * @param parameters
 * @returns
 */
export function useParameterChanges(parameters: PropsParameter[]) {

	const namespaces = parameters.map(p => p.namespace);

	const parameterChanges = useShapeDiverStoreParameters(state => Object.keys(state.parameterChanges)
		.filter(id => namespaces.includes(id))
		.reduce((acc, id) => {
			acc.push(state.parameterChanges[id]);

			return acc;
		}, [] as IParameterChanges[])
		.sort((a, b) => a.priority - b.priority)
	);

	return parameterChanges;
}
