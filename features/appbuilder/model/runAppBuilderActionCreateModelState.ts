import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions";
import {IAppBuilderActionPropsCreateModelState} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	AppBuilderActionRunContext,
	resolvedViewportId,
} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {
	isUpdateSharingLinkReplyError,
	resolveUpdateSharingLinkReply,
	UpdateSharingLinkReplyError,
} from "@AppBuilderLib/features/ecommerce/lib/interpretUpdateSharingLinkReply";
import type {ICreateModelStateData} from "@AppBuilderLib/features/model-state/config/createModelState";
import {createModelStateCore} from "@AppBuilderLib/features/model-state/lib/createModelStateCore";
import {resolveModelStateMessage} from "@AppBuilderLib/features/model-state/lib/resolveModelStateMessage";
import {
	applyCreateModelStateFilterDefaults,
	applyCreateModelStateScreenshotFallback,
	applyCreateModelStateThemeDefaults,
} from "@AppBuilderLib/features/model-state/model/createModelStateThemeDefaults";
import {getNotificationActions} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import NotificationModelStateCreated from "@AppBuilderLib/features/notifications/ui/NotificationModelStateCreated";
import {createElement} from "react";

const SAVE_MODEL_STATE_ERROR =
	"An error happened while saving the model state.";

export async function createModelStateFromStores(
	namespace: string,
	viewportId: string,
	props: ICreateModelStateData,
) {
	const themed = applyCreateModelStateFilterDefaults(props);
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
		parameterNamesToAlwaysExclude: themed.parameterNamesToAlwaysExclude,
		props: {
			...themed.props,
			screenshotProps: applyCreateModelStateScreenshotFallback(
				themed.props.screenshotProps,
			),
		},
	});
}

/** Create a model state and update the sharing link. */
export async function runAppBuilderActionCreateModelState(
	props: IAppBuilderActionPropsCreateModelState,
	context: AppBuilderActionRunContext,
): Promise<void> {
	const themed = applyCreateModelStateThemeDefaults(props);
	let modelStateId: string | undefined;
	try {
		const result = await createModelStateFromStores(
			context.namespace,
			resolvedViewportId(context),
			{
				...props,
				screenshotProps: themed.props.screenshotProps,
				parameterNamesToInclude: themed.props.parameterNamesToInclude,
				parameterNamesToExclude: themed.props.parameterNamesToExclude,
			},
		);
		modelStateId = result.modelStateId;
		if (modelStateId) {
			const api = await ECommerceApiSingleton;
			const reply = await api.updateSharingLink({
				modelStateId,
				updateUrl: true,
				imageUrl: result.screenshot,
				...(props.properties !== undefined
					? {properties: props.properties}
					: {}),
			});
			const resolved = resolveUpdateSharingLinkReply({
				reply,
				modelStateId,
				actionSuccessMessage: themed.successMessage,
				actionErrorMessage: themed.errorMessage,
				genericErrorMessage: SAVE_MODEL_STATE_ERROR,
			});
			if (resolved.status === "error") {
				getNotificationActions().error({message: resolved.message});
				throw new UpdateSharingLinkReplyError(resolved.message);
			}
			getNotificationActions().success({
				message:
					resolved.kind === "message"
						? resolved.message
						: createElement(NotificationModelStateCreated, {
								modelStateId,
								link: resolved.href,
							}),
			});
		}
	} catch (e) {
		if (!isUpdateSharingLinkReplyError(e)) {
			getNotificationActions().error({
				message:
					resolveModelStateMessage(
						themed.errorMessage,
						modelStateId,
					) ?? SAVE_MODEL_STATE_ERROR,
			});
		}
		throw e;
	}
}
