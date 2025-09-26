import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {IAppBuilderParameterValueSourcePropsSdtf} from "@AppBuilderShared/types/shapediver/appbuilder";
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
		const sdtfValuesArray: (string | File | undefined)[] = [];

		for (let i = 0; i < sources.length; i++) {
			const {source, type} = sources[i];
			const {sessionId, name, chunk} = source;

			const session = sessions[sessionId || namespace];
			if (!session) {
				console.warn(
					`Session with id ${sessionId || namespace} not found`,
				);
				sdtfValuesArray.push(undefined);
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
				sdtfValuesArray.push(undefined);
			} else {
				// we found the sdTF output, now we have to upload it
				// TODO, see what actual data is here
				// if (sdtfOutput.content === undefined) {
				// 	console.warn(
				// 		`sdTF output with name ${name} has no content in session ${namespace}`,
				// 	);
				// 	sdtfValuesArray.push(undefined);
				// } else {
				// 	new SdtfApi(config).uploadSdtf(session.id, [
				// 		{
				// 			namespace: "appbuilder",
				// 			content_length: sdtfOutput.content.length,
				// 			content_type: ReqSdtfType.MODEL_SDTF,
				// 		},
				// 	]);
				// }
			}
		}

		setSdtfValues(sdtfValuesArray);
	}, [sessions, sources]);

	return {sdtfValues, setSdtfValues};
}
