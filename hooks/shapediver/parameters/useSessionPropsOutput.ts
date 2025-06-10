import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {PropsOutput} from "@AppBuilderShared/types/components/shapediver/propsOutput";
import {IOutputApi} from "@shapediver/viewer.session";

/**
 * Hook providing a shortcut to create output props for UI components,
 * for all outputs of one or several sessions, using an optional filter.
 * @param namespace
 * @param filter optional filter for output definitions
 * @returns
 */
export function useSessionPropsOutput(
	namespace: string | string[],
	filter?: (output: IOutputApi) => boolean,
): PropsOutput[] {
	const _filter = filter || (() => true);

	const propsOutputs = useShapeDiverStoreSession((state) =>
		(Array.isArray(namespace) ? namespace : [namespace]).flatMap(
			(namespace) => {
				const session = state.sessions[namespace];
				if (!session) return [];

				return Object.values(session.outputs)
					.filter((output) => _filter(output))
					.map((output) => {
						return {
							namespace,
							outputId: output.id,
						};
					});
			},
		),
	);

	return propsOutputs;
}
