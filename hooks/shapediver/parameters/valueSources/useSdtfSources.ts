import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {PropsOutput} from "@AppBuilderShared/types/components/shapediver/propsOutput";
import {IAppBuilderParameterValueSourcePropsSdtf} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IShapeDiverOutput} from "@AppBuilderShared/types/shapediver/output";
import {
	ResAssetDefinition,
	ResStypeParameter,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import {useEffect, useMemo, useState} from "react";
import {useOutputs} from "../useOutputs";

export function useSdtfSources(props: {
	namespace: string;
	sources?: {
		source: IAppBuilderParameterValueSourcePropsSdtf;
		type: PARAMETER_TYPE;
	}[];
}): {
	sdtfValues: (string | File | undefined)[] | undefined;
	setSdtfValues: React.Dispatch<
		React.SetStateAction<(string | File | undefined)[] | undefined>
	>;
} {
	const {namespace, sources} = props;

	const [sdtfValues, setSdtfValues] = useState<
		(string | File | undefined)[] | undefined
	>(undefined);

	const session = useShapeDiverStoreSession(
		(state) => state.sessions[namespace],
	);

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
				source: IAppBuilderParameterValueSourcePropsSdtf | undefined;
		  }[]
		| undefined = useMemo(() => {
		if (!outputs || !sources) return undefined;
		return outputs.map((output, index) => ({
			output,
			source: sources[index]?.source,
		}));
	}, [outputs, sources]);

	// load all outputs
	// and only set the return values once all are loaded
	// to avoid multiple re-renders
	useEffect(() => {
		if (!outputResults || outputResults.length === 0) return;

		const promises = [];

		for (let i = 0; i < outputResults.length; i++) {
			const {output, source} = outputResults[i];
			if (!source) {
				promises.push(Promise.resolve(undefined));
				continue;
			}

			const {name, chunk} = source;

			if (!output) {
				console.warn(`sdTF output with name ${name} not found. `);
				promises.push(Promise.resolve(undefined));
			} else {
				// we found the sdTF output, now we have to upload it
				if (output.content === undefined) {
					console.warn(
						`sdTF output with name ${name} has no content.`,
					);
					promises.push(Promise.resolve(undefined));
				} else {
					if (
						output.content &&
						output.content[0] &&
						output.content[0].href
					) {
						// download the href and create an arrayBuffer
						const response = output.content[0];
						const url = response.href!;
						const file = fetch(url)
							.then((r) => r.arrayBuffer())
							.then(async (ab) => {
								const response: ResAssetDefinition[] =
									await session.uploadSDTF([ab]);

								// now create a ResStypeParameter object
								// with the uploaded asset id and the chunk if provided
								const sdtfResponse: ResStypeParameter = {
									asset: {
										id: response[0].id,
									},
								};

								if (chunk !== undefined) {
									sdtfResponse.asset!.chunk = chunk;
								}

								return JSON.stringify(sdtfResponse, null, 2);
							});

						promises.push(file);
					} else {
						promises.push(undefined);
					}
				}
			}
		}

		Promise.all(promises).then((res) => {
			setSdtfValues(res);
		});
	}, [outputResults, session]);

	return {sdtfValues, setSdtfValues};
}
