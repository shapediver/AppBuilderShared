import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {PropsOutput} from "@AppBuilderShared/types/components/shapediver/propsOutput";
import {IShapeDiverOutput} from "@AppBuilderShared/types/shapediver/output";
import {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook providing a shortcut to abstracted outputs managed by {@link useShapeDiverStoreParameters}.
 *
 * @see {@link PropsOutput}
 *
 * @param namespace
 * @param outputId Id, name, or displayname of the output
 * @returns
 */
export function useOutput(props: PropsOutput) {
	const {namespace, outputId} = props;
	const output = useShapeDiverStoreParameters(
		useShallow((state) => {
			const parameter = state.getOutput(namespace, outputId)!(
				(state) => state as IShapeDiverOutput,
			);
			return parameter;
		}),
	);

	const memoizedOutput = useMemo(() => {
		return {
			...output,
			definition: {...output.definition, ...props.overrides},
		};
	}, [output, props.overrides]);

	return memoizedOutput;
}
