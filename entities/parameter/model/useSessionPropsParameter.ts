import {ResParameter} from "@shapediver/sdk.geometry-api-sdk-v2";
import {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import {PropsParameter} from "../config/propsParameter";
import {useShapeDiverStoreParameters} from "./useShapeDiverStoreParameters";

/**
 * Hook providing a shortcut to create parameter props for the {@link ParametersAndExportsAccordionComponent}
 * component, for all parameters of one or several sessions, using an optional filter.
 * @param namespace
 * @param filter optional filter for parameter definitions
 * @returns
 */
export function useSessionPropsParameter(
	namespace: string | string[],
	filter?: (param: ResParameter) => boolean,
): PropsParameter[] {
	const _filter = filter || (() => true);

	// Select a flat list of primitive values (namespace, parameter id and
	// accept/reject mode per parameter), which the shallow comparison can
	// match. Creating the props objects inside the selector would return a
	// new array on every call and cause an infinite render loop.
	const selection = useShapeDiverStoreParameters(
		useShallow((state) =>
			(Array.isArray(namespace) ? namespace : [namespace]).flatMap(
				(namespace) =>
					Object.values(state.parameterStores[namespace] ?? {})
						.map((store) => store.getState())
						.filter((pstate) => _filter(pstate.definition))
						.flatMap((pstate) => [
							namespace,
							pstate.definition.id,
							pstate.acceptRejectMode,
						]),
			),
		),
	);

	return useMemo(() => {
		const propsParameters: PropsParameter[] = [];
		for (let i = 0; i < selection.length; i += 3) {
			propsParameters.push({
				namespace: selection[i] as string,
				parameterId: selection[i + 1] as string,
				acceptRejectMode: selection[
					i + 2
				] as PropsParameter["acceptRejectMode"],
			});
		}

		return propsParameters;
	}, [selection]);
}
