import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {IAppBuilderParameterValueSourcePropsDataOutput} from "@AppBuilderShared/types/shapediver/appbuilder";
import {useMemo} from "react";

/**
 * Hook to load an array of output value sources and return their values mapped by source name.
 * @param props
 * @returns
 */
export function useOutputValueSources(props: {
	namespace: string;
	sources: IAppBuilderParameterValueSourcePropsDataOutput[];
}): {
	[key: string]: string | undefined;
} {
	const {namespace, sources} = props;

	const session = useShapeDiverStoreSession((state) => {
		return state.sessions[namespace];
	});

	return useMemo(() => {
		if (!session) return {};

		const outputValues: {[key: string]: string | undefined} = {};

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
				outputValues[source.name] = undefined;
			} else if (output.content === undefined) {
				console.warn(
					`Output with name ${source.name} has no content in session ${namespace}`,
				);
				outputValues[source.name] = undefined;
			} else {
				outputValues[source.name] = JSON.stringify(output.content);
			}
		}

		return outputValues;
	}, [session, sources, namespace]);
}
