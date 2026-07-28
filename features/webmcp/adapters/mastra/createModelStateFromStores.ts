import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions";
import type {
	ICreateModelStateData,
	ICreateModelStateResult,
} from "@AppBuilderLib/features/model-state/config/createModelState";

/**
 * Store-backed createModelState for Mastra (non-React).
 * Live WebMCP gets `parameterNamesToAlwaysExclude` from the theme via
 * `useProps("CreateModelStateHook", …)`. Mastra hosts must pass the same
 * list (e.g. `["context"]` from themeOverrides) — it is not read from Mantine here.
 */
export async function createModelStateFromStores(
	namespace: string,
	props: ICreateModelStateData,
	viewportId = "viewport_1",
	parameterNamesToAlwaysExclude: string[] = [],
): Promise<ICreateModelStateResult> {
	const sessions = useShapeDiverStoreSession.getState().sessions;
	const sessionApi = sessions[namespace];
	if (!sessionApi) return {};

	const viewportAccessFunctions =
		useShapeDiverStoreViewportAccessFunctions.getState()
			.viewportAccessFunctions[viewportId];
	const currentGetScreenshot = viewportAccessFunctions?.getScreenshot;
	const currentConvertToGlTF = viewportAccessFunctions?.convertToGlTF;
	const clearUnsavedChanges =
		useShapeDiverStoreParameters.getState().clearUnsavedChanges;

	const {
		parameterNamesToInclude,
		parameterNamesToExclude,
		includeImage,
		image,
		data,
		includeGltf,
	} = props;

	const parameterValues = Object.values(sessionApi.parameters)
		.filter(
			(p) =>
				(!parameterNamesToInclude ||
					parameterNamesToInclude.includes(p.name) ||
					(p.displayname &&
						parameterNamesToInclude.includes(p.displayname))) &&
				(!parameterNamesToExclude ||
					!parameterNamesToExclude.includes(p.name) ||
					(p.displayname &&
						!parameterNamesToExclude.includes(p.displayname))) &&
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

	let modelStateImage: string | undefined = undefined;
	if (includeImage !== false && image) {
		if (image.href) {
			modelStateImage = image.href;
		} else if (image.export) {
			const exportSession = sessions[image.export.sessionId || namespace];
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

	const modelStateId = await sessionApi.createModelState(
		parameterValues,
		true,
		modelStateImage,
		data,
		includeGltf && currentConvertToGlTF
			? async () => currentConvertToGlTF()
			: undefined,
	);

	if (modelStateId) clearUnsavedChanges();

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
				? modelViewUrl + `/api/v2/model-state/${modelStateId}/image`
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
}
