import {PropsOutput} from "@AppBuilderLib/entities/output/config/propsOutput";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import {IShapeDiverOutputDefinition} from "../config/output";

/**
 * Hook providing a shortcut to create output props for UI components,
 * for all outputs of one or several sessions, using an optional filter.
 * @param namespace
 * @param filter optional filter for output definitions
 * @returns
 */
export function useSessionPropsOutput(
	namespace: string | string[],
	filter?: (output: IShapeDiverOutputDefinition) => boolean,
): PropsOutput[] {
	const _filter = filter || (() => true);

	// Select a flat list of (namespace, output id) pairs, which the shallow
	// comparison can match. Creating the props objects inside the selector
	// would return a new array on every call and cause an infinite render loop.
	const selection = useShapeDiverStoreParameters(
		useShallow((state) =>
			(Array.isArray(namespace) ? namespace : [namespace]).flatMap(
				(namespace) =>
					Object.values(state.outputStores[namespace] ?? {})
						.map((store) => store.getState().definition)
						.filter((definition) => _filter(definition))
						.flatMap((definition) => [namespace, definition.id]),
			),
		),
	);

	return useMemo(() => {
		const propsOutputs: PropsOutput[] = [];
		for (let i = 0; i < selection.length; i += 2) {
			propsOutputs.push({
				namespace: selection[i],
				outputId: selection[i + 1],
			});
		}

		return propsOutputs;
	}, [selection]);
}
