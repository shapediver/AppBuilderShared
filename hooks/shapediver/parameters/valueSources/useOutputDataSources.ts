import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {IAppBuilderParameterValueSourcePropsDataOutput} from "@AppBuilderShared/types/shapediver/appbuilder";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import {useEffect, useState} from "react";

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

	const sessions = useShapeDiverStoreSession((state) => {
		return state.sessions;
	});

	const [outputDataValues, setOutputDataValues] = useState<
		(string | File | undefined)[] | undefined
	>(undefined);

	useEffect(() => {
		if (!sessions || !sources) return;

		const outputValues: (string | File | undefined)[] = [];

		for (let i = 0; i < sources.length; i++) {
			const {source, type} = sources[i];
			const {sessionId, name} = source;
			const session = sessions[sessionId || namespace];
			if (!session) {
				console.warn(
					`Session with id ${sessionId || namespace} not found`,
				);
				outputValues.push(undefined);
				continue;
			}

			const output = Object.values(session.outputs).find(
				(o) =>
					o.displayname === name || o.name === name || o.id === name,
			);

			if (!output) {
				console.warn(
					`Output with name ${name} not found in session ${namespace}`,
				);
				outputValues.push(undefined);
			} else if (output.content === undefined) {
				console.warn(
					`Output with name ${name} has no content in session ${namespace}`,
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
						`${output.id}_${output.version}.json`,
						{
							type: blob.type,
						},
					);
					outputValues.push(file);
				}
			}
		}

		setOutputDataValues(outputValues);
	}, [sources, namespace, sessions]);

	return {
		outputDataValues,
		setOutputDataValues,
	};
}
