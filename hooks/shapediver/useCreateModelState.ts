import {useCallback} from "react";
import {useShallow} from "zustand/react/shallow";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderShared/store/useShapeDiverStoreViewportAccessFunctions";

interface Props {
	namespace: string;
}

/**
 * Hook wrapping @see {@link ISessionApi.createModelState}
 *
 * @param props
 * @returns
 */
export function useCreateModelState(props: Props) {
	const {namespace: sessionId} = props;
	const {viewportId} = useViewportId();
	const {sessionApi} = useShapeDiverStoreSession(
		useShallow((state) => ({
			sessionApi: state.sessions[sessionId],
		})),
	);
	const {getScreenshot, convertToGlTF} =
		useShapeDiverStoreViewportAccessFunctions(
			useShallow((state) => ({
				getScreenshot:
					state.viewportAccessFunctions[viewportId]?.getScreenshot,
				convertToGlTF:
					state.viewportAccessFunctions[viewportId]?.convertToGlTF,
			})),
		);

	const createModelState = useCallback(
		async (
			parameterValues?: {[key: string]: unknown},
			omitSessionParameterValues?: boolean,
			includeImage?: boolean,
			data?: Record<string, any>,
			includeGltf?: boolean,
		) => {
			// we need to create a screenshot before the model state
			// as the function signature of createModelState does not allow to pass a promise for the screenshot
			// Jira-task: https://shapediver.atlassian.net/browse/SS-8363
			const screenshot =
				includeImage && getScreenshot
					? await getScreenshot()
					: undefined;

			const modelStateId = sessionApi
				? await sessionApi.createModelState(
						parameterValues,
						omitSessionParameterValues,
						screenshot,
						data, // <-- custom data
						includeGltf && convertToGlTF
							? async () => convertToGlTF()
							: undefined,
					)
				: undefined;

			return {modelStateId, screenshot};
		},
		[sessionApi, getScreenshot, convertToGlTF],
	);

	return {
		createModelState,
	};
}
