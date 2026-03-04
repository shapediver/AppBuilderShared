import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {PropsOutput} from "@AppBuilderLib/entities/output/config/propsOutput";
import {IShapeDiverOutput} from "../config/output";
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
			const output = state.getOutput(
				namespace,
				outputId,
			)?.((state) => state as IShapeDiverOutput);
			return output;
		}),
	);

	const memoizedOutput = useMemo(() => {
		return output
			? {
					...output,
					definition: {...output.definition, ...props.overrides},
				}
			: undefined;
	}, [output, props.overrides]);

	return memoizedOutput;
}
