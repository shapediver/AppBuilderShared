import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {IAppBuilderParameterValueSourcePropsSdtf} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	ResAssetDefinition,
	ResStypeParameter,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import {useEffect, useState} from "react";

export function useSdtfSources(props?: {
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
	// default to empty values if no props are given
	const {namespace, sources} = props ?? {
		namespace: "",
		sources: [],
	};

	const sessions = useShapeDiverStoreSession((state) => {
		return state.sessions;
	});

	const [sdtfValues, setSdtfValues] = useState<
		(string | File | undefined)[] | undefined
	>(undefined);

	useEffect(() => {
		if (!sessions || !sources) return;

		const promises = [];

		for (let i = 0; i < sources.length; i++) {
			const {source} = sources[i];
			const {sessionId, name, chunk} = source;

			const session = sessions[sessionId || namespace];
			if (!session) {
				console.warn(
					`Session with id ${sessionId || namespace} not found`,
				);
				promises.push(Promise.resolve(undefined));
				continue;
			}

			const sdtfOutput = Object.values(session.outputs).find(
				(o) =>
					o.displayname === name || o.name === name || o.id === name,
			);
			if (!sdtfOutput) {
				console.warn(
					`sdTF output with name ${name} not found in session ${namespace}`,
				);
				promises.push(Promise.resolve(undefined));
			} else {
				// we found the sdTF output, now we have to upload it
				if (sdtfOutput.content === undefined) {
					console.warn(
						`sdTF output with name ${name} has no content in session ${namespace}`,
					);
					promises.push(Promise.resolve(undefined));
				} else {
					if (
						sdtfOutput.content &&
						sdtfOutput.content[0] &&
						sdtfOutput.content[0].href
					) {
						// download the href and create an arrayBuffer
						const response = sdtfOutput.content[0];
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
	}, [sessions, sources]);

	return {sdtfValues, setSdtfValues};
}
