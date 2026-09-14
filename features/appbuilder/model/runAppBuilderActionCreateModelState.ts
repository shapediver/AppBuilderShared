import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions";
import {IAppBuilderActionPropsCreateModelState} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	AppBuilderActionRunContext,
	resolvedViewportId,
} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {createModelStateCore} from "@AppBuilderLib/features/model-state/lib/createModelStateCore";
import {resolveModelStateMessage} from "@AppBuilderLib/features/model-state/lib/resolveModelStateMessage";
import {getNotificationActions} from "@AppBuilderLib/features/notifications/model/useNotificationStore";

export async function createModelStateFromStores(
	namespace: string,
	viewportId: string,
	props: IAppBuilderActionPropsCreateModelState,
) {
	const sessions = useShapeDiverStoreSession.getState().sessions;
	const viewportAccessFunctions =
		useShapeDiverStoreViewportAccessFunctions.getState()
			.viewportAccessFunctions[viewportId];
	const {clearUnsavedChanges} = useShapeDiverStoreParameters.getState();
	return createModelStateCore({
		sessionApi: sessions[namespace],
		sessions,
		sessionId: namespace,
		viewportAccessFunctions: {
			getScreenshot: viewportAccessFunctions?.getScreenshot,
			convertToGlTF: viewportAccessFunctions?.convertToGlTF,
		},
		clearUnsavedChanges,
		parameterNamesToAlwaysExclude: [],
		props: {
			includeImage: props.includeImage,
			image: props.image,
			includeGltf: props.includeGltf,
			screenshotProps: props.screenshotProps,
			parameterNamesToInclude: props.parameterNamesToInclude,
			parameterNamesToExclude: props.parameterNamesToExclude,
		},
	});
}

/** Create a model state and update the sharing link. */
export async function runAppBuilderActionCreateModelState(
	props: IAppBuilderActionPropsCreateModelState,
	context: AppBuilderActionRunContext,
): Promise<void> {
	let modelStateId: string | undefined;
	try {
		const result = await createModelStateFromStores(
			context.namespace,
			resolvedViewportId(context),
			props,
		);
		modelStateId = result.modelStateId;
		if (modelStateId) {
			const api = await ECommerceApiSingleton;
			await api.updateSharingLink({
				modelStateId,
				updateUrl: true,
				imageUrl: result.screenshot,
			});
			const message = resolveModelStateMessage(
				props.successMessage,
				modelStateId,
			);
			if (message) {
				getNotificationActions().success({message});
			}
		}
	} catch (e) {
		getNotificationActions().error({
			message:
				resolveModelStateMessage(props.errorMessage, modelStateId) ??
				"An error happened while saving the model state.",
		});
		throw e;
	}
}
