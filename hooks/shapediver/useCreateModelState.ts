import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderShared/store/useShapeDiverStoreViewportAccessFunctions";
import {MantineThemeComponent, useProps} from "@mantine/core";
import {useCallback} from "react";
import {useShallow} from "zustand/react/shallow";

interface ThemeProps {
	parameterNamesToInclude?: string[];
	parameterNamesToExclude?: string[];
}

const defaultThemeProps: Partial<ThemeProps> = {};

type CreateModelStateHookThemePropsType = Partial<ThemeProps>;

export function CreateModelStateHookThemeProps(
	props: CreateModelStateHookThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

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

	const {
		parameterNamesToInclude: parameterNamesToIncludeDefault,
		parameterNamesToExclude: parameterNamesToExcludeDefault,
	} = useProps(
		"CreateModelStateHook",
		defaultThemeProps,
		{} as CreateModelStateHookThemePropsType,
	);

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
			parameterNamesToInclude = parameterNamesToIncludeDefault,
			parameterNamesToExclude = parameterNamesToExcludeDefault,
			includeImage?: boolean,
			data?: Record<string, any>,
			includeGltf?: boolean,
		) => {
			const parameterValues = Object.values(sessionApi.parameters)
				.filter(
					(p) =>
						(!parameterNamesToInclude ||
							parameterNamesToInclude.includes(p.name) ||
							(p.displayname &&
								parameterNamesToInclude.includes(
									p.displayname,
								))) &&
						(!parameterNamesToExclude ||
							!parameterNamesToExclude.includes(p.name) ||
							(p.displayname &&
								!parameterNamesToExclude.includes(
									p.displayname,
								))),
				)
				.reduce(
					(params, p) => {
						params[p.id] = p.value;
						return params;
					},
					{} as {[key: string]: unknown},
				);

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
						true, // <-- omitSessionParameterValues
						screenshot,
						data, // <-- custom data
						includeGltf && convertToGlTF
							? async () => convertToGlTF()
							: undefined,
					)
				: undefined;

			return {modelStateId, screenshot};
		},
		[
			sessionApi,
			getScreenshot,
			convertToGlTF,
			parameterNamesToIncludeDefault,
			parameterNamesToExcludeDefault,
		],
	);

	return {
		createModelState,
	};
}
