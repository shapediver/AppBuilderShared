import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {MantineThemeComponent, useProps} from "@mantine/core";
import {useCallback} from "react";
import {useShallow} from "zustand/react/shallow";
import {
	ICreateModelStateData,
	ICreateModelStateResult,
} from "../config/createModelState";
import {createModelStateCore} from "../lib/createModelStateCore";
import type {CreateModelStateHookThemeDefaultProps} from "./useCreateModelState.types";
type CreateModelStateHookThemePropsType =
	Partial<CreateModelStateHookThemeDefaultProps>;

const defaultThemeProps: CreateModelStateHookThemeDefaultProps = {};

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
		parameterNamesToAlwaysExclude = [],
		successMessage,
		errorMessage,
	} = useProps(
		"CreateModelStateHook",
		defaultThemeProps,
		{} as CreateModelStateHookThemePropsType,
	);

	const {viewportId} = useViewportId();
	const {sessions} = useShapeDiverStoreSession(
		useShallow((state) => ({
			sessions: state.sessions,
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

	const {clearUnsavedChanges} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			clearUnsavedChanges: state.clearUnsavedChanges,
		})),
	);

	const createModelState = useCallback(
		async (
			props: ICreateModelStateData,
			options?: {
				/**
				 * Whether creating this model state marks the current
				 * configuration as saved (clears the `unsavedChanges` flag).
				 * Defaults to `true`. Pass `false` for internal model state
				 * creations that are not user-initiated saves (e.g. parameter
				 * value sources).
				 */
				markSaved?: boolean;
			},
		): Promise<ICreateModelStateResult> => {
			// Viewport access functions are registered in an effect after the
			// viewport is created. Read the store again at invocation time so a
			// callback retained before that effect ran can still capture an image.
			const viewportAccessFunctions =
				useShapeDiverStoreViewportAccessFunctions.getState()
					.viewportAccessFunctions[viewportId];
			const currentGetScreenshot =
				viewportAccessFunctions?.getScreenshot ?? getScreenshot;
			const currentConvertToGlTF =
				viewportAccessFunctions?.convertToGlTF ?? convertToGlTF;

			const {
				parameterNamesToInclude = parameterNamesToIncludeDefault,
				parameterNamesToExclude = parameterNamesToExcludeDefault,
				...restProps
			} = props;

			return createModelStateCore({
				sessionApi: sessions[sessionId],
				sessions,
				sessionId,
				viewportAccessFunctions: {
					getScreenshot: currentGetScreenshot,
					convertToGlTF: currentConvertToGlTF,
				},
				clearUnsavedChanges,
				parameterNamesToAlwaysExclude,
				props: {
					...restProps,
					parameterNamesToInclude,
					parameterNamesToExclude,
				},
				markSaved: options?.markSaved ?? true,
			});
		},
		[
			sessions,
			sessionId,
			getScreenshot,
			convertToGlTF,
			parameterNamesToIncludeDefault,
			parameterNamesToExcludeDefault,
			parameterNamesToAlwaysExclude,
			clearUnsavedChanges,
		],
	);

	return {
		createModelState,
		successMessage,
		errorMessage,
	};
}
