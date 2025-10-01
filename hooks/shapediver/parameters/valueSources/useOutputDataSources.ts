import {PropsOutput} from "@AppBuilderShared/types/components/shapediver/propsOutput";
import {IAppBuilderParameterValueSourcePropsDataOutput} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IShapeDiverOutput} from "@AppBuilderShared/types/shapediver/output";
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
		upload?: (file: File) => Promise<string>;
	}[];
}): {
	outputDataValues: (string | undefined)[] | undefined;
	resetOutputDataValues: () => void;
} {
	const {namespace, sources} = props;

	const [outputDataValues, setOutputDataValues] = useState<
		(string | undefined)[] | undefined
	>(undefined);

	// create output map from sources
	const outputMap: PropsOutput[] = useMemo(() => {
		if (!sources) return [];
		return sources
			.map(({source}) => {
				const {sessionId, name} = source;
				if (!namespace && !sessionId) return;

				return {
					namespace: sessionId || namespace,
					outputId: name,
				};
			})
			.filter((e): e is PropsOutput => !!e);
	}, [namespace, sources]);

	// get all outputs
	const outputs: (IShapeDiverOutput | undefined)[] = useOutputs(outputMap);

	// create a combined array of outputs and their types
	const outputResults:
		| {
				output: IShapeDiverOutput | undefined;
				upload?: (file: File) => Promise<string>;
		  }[]
		| undefined = useMemo(() => {
		if (!outputs || !sources) return undefined;
		return outputs.map((output, index) => ({
			output,
			upload: sources[index]?.upload,
		}));
	}, [outputs, sources]);

	// load all outputs
	useEffect(() => {
		if (!outputResults || outputResults.length === 0) return;

		const promises = [];
		for (let i = 0; i < outputResults.length; i++) {
			const {output, upload} = outputResults[i];
			if (!output) {
				promises.push(Promise.resolve(undefined));
			} else if (output.content === undefined) {
				console.warn(
					`Output with id ${output.definition.id} has no content`,
				);
				promises.push(Promise.resolve(undefined));
			} else {
				if (upload) {
					// create a blob url for the output content
					const blob = new Blob(
						[JSON.stringify({content: output.content})],
						{
							type: "application/json",
						},
					);
					const file = new File(
						[blob],
						`${output.definition.id}_${output.definition.version}.json`,
						{
							type: blob.type,
						},
					);
					promises.push(upload(file));
				} else {
					promises.push(JSON.stringify({content: output.content}));
				}
			}
		}

		Promise.all(promises).then((values) => {
			setOutputDataValues(values);
		});
	}, [outputResults]);

	return {
		outputDataValues,
		resetOutputDataValues: () => setOutputDataValues(undefined),
	};
}
