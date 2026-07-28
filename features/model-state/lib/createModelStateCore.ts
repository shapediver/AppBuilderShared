import type {ISessionApi} from "@shapediver/viewer.session";
import type {
	ICreateModelStateData,
	ICreateModelStateResult,
} from "../config/createModelState";

export interface CreateModelStateCoreArgs {
	sessionApi: ISessionApi | undefined;
	/** All sessions — needed for `image.export` cross-session lookup. */
	sessions: {[id: string]: ISessionApi};
	/** Namespace / session id used for export-session fallback. */
	sessionId: string;
	viewportAccessFunctions?: {
		getScreenshot?: () => Promise<string>;
		convertToGlTF?: () => Promise<unknown>;
	};
	clearUnsavedChanges: () => void;
	parameterNamesToAlwaysExclude: string[];
	props: ICreateModelStateData;
	/** Defaults to `true`. */
	markSaved?: boolean;
}

/**
 * Pure createModelState logic shared by the React hook and the hook-free store port.
 */
export async function createModelStateCore(
	args: CreateModelStateCoreArgs,
): Promise<ICreateModelStateResult> {
	const {
		sessionApi,
		sessions,
		sessionId,
		viewportAccessFunctions,
		clearUnsavedChanges,
		parameterNamesToAlwaysExclude,
		props,
		markSaved = true,
	} = args;

	const currentGetScreenshot = viewportAccessFunctions?.getScreenshot;
	const currentConvertToGlTF = viewportAccessFunctions?.convertToGlTF;

	const {
		parameterNamesToInclude,
		parameterNamesToExclude,
		includeImage,
		image,
		data,
		includeGltf,
	} = props;

	if (!sessionApi) return {};

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
			const exportSession = sessions[image.export.sessionId || sessionId];
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
