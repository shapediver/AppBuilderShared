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
	const outputs = useShapeDiverStoreParameters(
		useShallow((state) => {
			return props.map(({outputId, namespace, overrides}) => {
				if (!state) return;
				const _output = state.getOutput(namespace, outputId);
				if (!_output) return;
				const output = _output.getState() as IShapeDiverOutput;
				return {output, overrides: overrides};
			});
		}),
	);

	return useMemo(() => {
		return outputs.map((o) => {
			if (!o) return;
			return {
				...o.output,
				definition: {...o.output.definition, ...o.overrides},
			};
		});
	}, [outputs]);
}
