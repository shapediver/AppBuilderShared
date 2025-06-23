import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {PropsOutput} from "@AppBuilderShared/types/components/shapediver/propsOutput";
import {IShapeDiverOutputDefinition} from "@AppBuilderShared/types/shapediver/output";

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

	const propsOutputs = useShapeDiverStoreParameters((state) =>
		(Array.isArray(namespace) ? namespace : [namespace]).flatMap(
			(namespace) =>
				Object.values(state.getOutputs(namespace))
					.filter((store) => _filter(store.getState().definition))
					.map((store) => {
						const state = store.getState();

						return {
							namespace,
							outputId: state.definition.id,
						};
					}),
		),
	); // <-- TODO SS-8052 review how to avoid unnecessary re-renders

	return propsOutputs;
}
