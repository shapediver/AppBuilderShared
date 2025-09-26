import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {IAppBuilderParameterValueSourcePropsDataOutput} from "@AppBuilderShared/types/shapediver/appbuilder";
import {useEffect, useState} from "react";

/**
 * Hook to load an array of output value sources and return their values mapped by source name.
 * @param props
 * @returns
 */
export function useOutputValueSources(props: {
	namespace: string;
	sources?: IAppBuilderParameterValueSourcePropsDataOutput[];
}): {
	outputValues: (string | undefined)[] | undefined;
	setOutputValues: React.Dispatch<
		React.SetStateAction<(string | undefined)[] | undefined>
	>;
} {
	const {namespace, sources} = props;

	const session = useShapeDiverStoreSession((state) => {
		return state.sessions[namespace];
	});

	const [outputValues, setOutputValues] = useState<
		(string | undefined)[] | undefined
	>(undefined);

	useEffect(() => {
		if (!session || !sources) return;

		const outputValues: (string | undefined)[] = [];

		for (let i = 0; i < sources.length; i++) {
			const source = sources[i];

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
				outputValues.push(JSON.stringify(output.content));
			}
		}

		setOutputValues(outputValues);
	}, [sources, namespace, session]);

	return {
		outputValues,
		setOutputValues,
	};
}
