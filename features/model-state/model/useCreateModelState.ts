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
			const {markSaved = true} = options ?? {};
			const {
				parameterNamesToInclude = parameterNamesToIncludeDefault,
				parameterNamesToExclude = parameterNamesToExcludeDefault,
				includeImage,
				image,
				data,
				includeGltf,
			} = props;
			const sessionApi = sessions[sessionId];
			if (!sessionApi) return {};
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
								))) &&
						(!parameterNamesToAlwaysExclude.includes(p.name) ||
							(p.displayname &&
								!parameterNamesToAlwaysExclude.includes(
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

			// create the image for the model state (if includeImage is true)
			// if an image ref is provided, use that (unless includeImage is false)
			// if the image ref points to an export, try to get the export from the session and request it
			// otherwise, if no image ref is provided, use getScreenshot (if available)
			// if includeImage is false or undefined, do not create an image
			let modelStateImage: string | undefined = undefined;
			if (includeImage !== false && image) {
				if (image.href) {
					modelStateImage = image.href;
				} else if (image.export) {
					const exportSession =
						sessions[image.export.sessionId || sessionId];
					if (exportSession) {
						const exp = Object.values(exportSession.exports).find(
							(e) =>
								e.id === image.export?.name ||
								e.name === image.export?.name ||
								e.displayname === image.export?.name,
						);
						if (exp) {
							const exportResult = await exp.request();
							if (
								exportResult.content &&
								exportResult.content[0] &&
								exportResult.content[0].href
							) {
								modelStateImage = exportResult.content[0].href;
							}
						}
					}
				}
			} else if (includeImage && currentGetScreenshot) {
				modelStateImage = await currentGetScreenshot();
			}

			const modelStateId = sessionApi
				? await sessionApi.createModelState(
						parameterValues,
						true, // <-- omitSessionParameterValues
						modelStateImage, // <-- screenshot or provided image
						data, // <-- custom data
						includeGltf && currentConvertToGlTF
							? async () => currentConvertToGlTF()
							: undefined,
					)
				: undefined;

			// creating a model state persists the current configuration,
			// so there are no unsaved changes anymore (unless the caller opted out)
			if (modelStateId && markSaved) clearUnsavedChanges();

			const modelViewUrl = sessionApi.modelViewUrl.endsWith("/")
				? sessionApi.modelViewUrl.substring(
						0,
						sessionApi.modelViewUrl.length - 1,
					)
				: sessionApi.modelViewUrl;

			return {
				modelStateId,
				screenshot: modelStateImage,
				modelViewUrl,
				modelStateImageUrl:
					modelStateImage && modelStateId
						? modelViewUrl +
							`/api/v2/model-state/${modelStateId}/image`
						: undefined,
				modelStateGltfUrl:
					includeGltf && modelStateId
						? modelViewUrl + `/api/v2/ar-scene/${modelStateId}/gltf`
						: undefined,
				modelStateUsdzUrl:
					includeGltf && modelStateId
						? modelViewUrl + `/api/v2/ar-scene/${modelStateId}/usdz`
						: undefined,
			};
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
