import {PropsParameter} from "../config/propsParameter";
import {useShapeDiverStoreParameters} from "./useShapeDiverStoreParameters";

/**
 * Get parameter change objects, with their session namespace, for all sessions used by the given parameters.
 * @see {@link IParameterChanges}
 *
 * @param parameters
 * @returns
 */
export function useParameterChanges(parameters: PropsParameter[]) {
	const namespaces = parameters.map((p) => p.namespace);

	const parameterChanges = useShapeDiverStoreParameters((state) =>
		Object.keys(state.parameterChanges)
			.filter((id) => namespaces.includes(id))
			.map((id) => ({
				namespace: id,
				changes: state.parameterChanges[id],
			}))
			.sort((a, b) => a.changes.priority - b.changes.priority),
	);

	return parameterChanges;
}
