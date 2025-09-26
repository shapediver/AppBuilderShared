import {
	IAppBuilderParameterValueSourceDefinition,
	IAppBuilderParameterValueSourcePropsDataOutput,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {useMemo} from "react";
import {useOutputValueSources} from "./valueSources/useOutputValueSources";

/**
 * Hook to load an array of parameter value sources and return their values in the same order.
 *
 * @param props
 * @returns
 */
export function useParameterValueSources(props?: {
	namespace: string;
	sources: IAppBuilderParameterValueSourceDefinition[];
}): unknown[] {
	// default to empty values if no props are given
	// this avoids issues with useMemo and useOutputValueSources
	const {namespace, sources} = props ?? {
		namespace: "",
		sources: [],
	};

	// separate sources by type and call their respective hooks
	const {outputSources} = useMemo(() => {
		const outputSources: IAppBuilderParameterValueSourcePropsDataOutput[] =
			[];

		for (let i = 0; i < sources.length; i++) {
			const source = sources[i];
			if (source.type === "dataOutput") {
				outputSources.push(
					source.props as IAppBuilderParameterValueSourcePropsDataOutput,
				);
			} else {
				// todo: handle other source types
			}
		}

		return {outputSources};
	}, [sources]);

	// get output values
	const outputValues = useOutputValueSources({
		namespace,
		sources: outputSources,
	});

	// map output values to their source names
	// and create an array of results in the same order as sources
	return useMemo(() => {
		// here we also add other source types
		// so that we can return them all together
		const sourceResults: unknown[] = [];
		for (let i = 0; i < sources.length; i++) {
			const source = sources[i];
			if (source.type === "dataOutput") {
				sourceResults.push(
					outputValues[
						(
							source.props as IAppBuilderParameterValueSourcePropsDataOutput
						).name
					],
				);
			} else {
				sourceResults.push(undefined);
			}
		}
		return sourceResults;
	}, [outputValues]);
}
