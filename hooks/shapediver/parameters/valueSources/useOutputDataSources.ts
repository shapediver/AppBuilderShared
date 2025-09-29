import {PropsOutput} from "@AppBuilderShared/types/components/shapediver/propsOutput";
import {IAppBuilderParameterValueSourcePropsDataOutput} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IShapeDiverOutput} from "@AppBuilderShared/types/shapediver/output";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import {useEffect, useMemo, useState} from "react";
import {useOutputs} from "../useOutputs";

/**
 * Hook to load an array of output value sources and return their values mapped by source name.
 * @param props
 * @returns
 */
export function useOutputDataSources(props: {
	namespace: string;
	sources?: {
		source: IAppBuilderParameterValueSourcePropsDataOutput;
		type: PARAMETER_TYPE;
	}[];
}): {
	outputDataValues: (string | File | undefined)[] | undefined;
	setOutputDataValues: React.Dispatch<
		React.SetStateAction<(string | File | undefined)[] | undefined>
	>;
} {
	const {namespace, sources} = props;

	const [outputDataValues, setOutputDataValues] = useState<
		(string | File | undefined)[] | undefined
	>(undefined);

	const outputMap: PropsOutput[] = useMemo(() => {
		if (!sources) return [];
		return sources
			.map(({source}) => {
				const {sessionId, name} = source;
				return {
					namespace: sessionId || namespace,
					outputId: name,
				};
			})
			.filter((o) => o.outputId);
	}, [namespace, sources]);

	const outputs: (IShapeDiverOutput | undefined)[] = useOutputs(outputMap);

	const outputResults:
		| {
				output: IShapeDiverOutput | undefined;
				type: PARAMETER_TYPE;
		  }[]
		| undefined = useMemo(() => {
		if (!outputs || !sources) return undefined;
		return outputs.map((output, index) => ({
			output,
			type: sources[index]?.type,
		}));
	}, [outputs, sources]);

	useEffect(() => {
		if (!outputResults || outputResults.length === 0) return;

		const outputValues: (string | File | undefined)[] = [];
		for (let i = 0; i < outputResults.length; i++) {
			const {output, type} = outputResults[i];
			if (!output) {
				outputValues.push(undefined);
			} else if (output.content === undefined) {
				console.warn(
					`Output with id ${output.definition.id} has no content`,
				);
				outputValues.push(undefined);
			} else {
				if (type === PARAMETER_TYPE.STRING) {
					outputValues.push(JSON.stringify(output.content));
				} else if (type === PARAMETER_TYPE.FILE) {
					// create a blob url for the output content
					const blob = new Blob([JSON.stringify(output.content)], {
						type: "application/json",
					});
					const file = new File(
						[blob],
						`${output.definition.id}_${output.definition.version}.json`,
						{
							type: blob.type,
						},
					);
					outputValues.push(file);
				}
			}
		}
		setOutputDataValues(outputValues);
	}, [outputResults]);

	return {
		outputDataValues,
		setOutputDataValues,
	};
}
