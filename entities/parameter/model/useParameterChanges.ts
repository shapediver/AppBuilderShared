import {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import {PropsParameter} from "../config/propsParameter";
import {IParameterChanges} from "../config/shapediverStoreParameters";
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

	// Select a flat list of (namespace, parameter changes) pairs. The change
	// objects are stable store references, so the shallow comparison can
	// match. Creating wrapper objects inside the selector would return a new
	// array on every call and cause an infinite render loop.
	const selection = useShapeDiverStoreParameters(
		useShallow((state) =>
			Object.keys(state.parameterChanges)
				.filter((id) => namespaces.includes(id))
				.flatMap((id) => [id, state.parameterChanges[id]]),
		),
	);

	return useMemo(() => {
		const parameterChanges: {
			namespace: string;
			changes: IParameterChanges;
		}[] = [];
		for (let i = 0; i < selection.length; i += 2) {
			parameterChanges.push({
				namespace: selection[i] as string,
				changes: selection[i + 1] as IParameterChanges,
			});
		}

		return parameterChanges.sort(
			(a, b) => a.changes.priority - b.changes.priority,
		);
	}, [selection]);
}
