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

	const session = useShapeDiverStoreSession((state) => {
		return state.sessions[namespace];
	});

	const [outputDataValues, setOutputDataValues] = useState<
		(string | File | undefined)[] | undefined
	>(undefined);

	useEffect(() => {
		if (!session || !sources) return;

		const outputValues: (string | File | undefined)[] = [];

		for (let i = 0; i < sources.length; i++) {
			const {source, type} = sources[i];

			const output = Object.values(session.outputs).find(
				(o) =>
					o.displayname === source.name ||
					o.name === source.name ||
					o.id === source.name,
			);

			if (!output) {
				console.warn(
					`Output with name ${source.name} not found in session ${namespace}`,
				);
				outputValues.push(undefined);
			} else if (output.content === undefined) {
				console.warn(
					`Output with name ${source.name} has no content in session ${namespace}`,
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
	}, [sources, namespace, session]);

	return {
		outputDataValues,
		setOutputDataValues,
	};
}
