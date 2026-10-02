import {PropsOutput} from "@AppBuilderLib/entities/output/config/propsOutput";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import {IShapeDiverOutput} from "../config/output";

/**
 * Hook providing a shortcut to multiple abstracted outputs managed by {@link useShapeDiverStoreParameters}.
 *
 * @param parameterProps Array of parameter props
 * @returns Array of outputs in the same order as input
 */
export function useOutputs(props: PropsOutput[]) {
	// Select the output state objects only. Their references are stable
	// until the respective output store changes, which allows the shallow
	// comparison to succeed. Creating wrapper objects inside the selector
	// would defeat the shallow comparison and return a new array on
	// every render, which causes effect loops in consumers.
	const outputs = useShapeDiverStoreParameters(
		useShallow((state) => {
			return props.map(({outputId, namespace}) => {
				if (!state) return;
				const _output = state.getOutput(namespace, outputId);
				if (!_output) return;
				return _output.getState() as IShapeDiverOutput;
			});
		}),
	);

	return useMemo(() => {
		return outputs.map((output, index) => {
			if (!output) return;
			return {
				...output,
				definition: {...output.definition, ...props[index]?.overrides},
			};
		});
	}, [outputs, props]);
}
