import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderShared/store/useShapeDiverStoreViewportAccessFunctions";
import {IAppBuilderImageRef} from "@AppBuilderShared/types/shapediver/appbuilder";
import {MantineThemeComponent, useProps} from "@mantine/core";
import {ISessionApi} from "@shapediver/viewer.session";
import {useCallback} from "react";
import {useShallow} from "zustand/react/shallow";

interface ThemeProps {
	parameterNamesToInclude?: string[];
	parameterNamesToExclude?: string[];
	parameterNamesToAlwaysExclude?: string[];
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
		parameterNamesToAlwaysExclude = [],
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

	const createModelState = useCallback(
		async (
			parameterNamesToInclude = parameterNamesToIncludeDefault,
			parameterNamesToExclude = parameterNamesToExcludeDefault,
			includeImage?: boolean,
			image?: IAppBuilderImageRef | undefined,
			data?: Record<string, any>,
			includeGltf?: boolean,
		): Promise<{
			/** Id of created model state. */
			modelStateId?: string;
			/** Data URL of the created screenshot or href to a specified image (either via export or directly) */
			screenshot?: string;
			/** Model view URL of the Geometry Backend system the model state was created on. */
			modelViewUrl?: string;
			/** URL of the image saved as part of the model state. */
			modelStateImageUrl?: string;
			/** URL of the glTF asset saved as part of the model state. */
			modelStateGltfUrl?: string;
			/** URL of the usdz asset saved as part of the model state. */
			modelStateUsdzUrl?: string;
		}> => {
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
			} else if (includeImage && getScreenshot) {
				modelStateImage = await getScreenshot();
			}

			const modelStateId = sessionApi
				? await sessionApi.createModelState(
						parameterValues,
						true, // <-- omitSessionParameterValues
						modelStateImage, // <-- screenshot or provided image
						data, // <-- custom data
						includeGltf && convertToGlTF
							? async () => convertToGlTF()
							: undefined,
					)
				: undefined;

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
		],
	);

	return {
		createModelState,
	};
}
