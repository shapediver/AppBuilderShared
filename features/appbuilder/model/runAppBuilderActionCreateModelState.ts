import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions";
import {IAppBuilderActionPropsCreateModelState} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	AppBuilderActionRunContext,
	resolvedViewportId,
} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
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
			const {href} = await api.updateSharingLink({
				modelStateId,
				updateUrl: true,
				imageUrl: result.screenshot,
			});
			const message = resolveModelStateMessage(
				themed.successMessage,
				modelStateId,
			);
			getNotificationActions().success({
				message:
					message ??
					createElement(NotificationModelStateCreated, {
						modelStateId,
						link: href.toString(),
					}),
			});
		}
	} catch (e) {
		getNotificationActions().error({
			message:
				resolveModelStateMessage(themed.errorMessage, modelStateId) ??
				"An error happened while saving the model state.",
		});
		throw e;
	}
}
