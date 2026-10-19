import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport";
import {
	IAppBuilderActionDefinition,
	isArAction,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	AppBuilderActionRunContext,
	resolvedViewportId,
} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {useAppBuilderActionArQrStore} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionArQrStore";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {FLAG_TYPE} from "@shapediver/viewer.session";

/** ShapeDiver-viewer AR executor. Register from the host `componentContext`. */
export async function runAppBuilderActionAr(
	definition: IAppBuilderActionDefinition,
	context: AppBuilderActionRunContext,
): Promise<void> {
	if (!isArAction(definition)) return;

	const viewportId =
		definition.props.viewportId ?? resolvedViewportId(context);
	const viewportApi =
		useShapeDiverStoreViewport.getState().viewports[viewportId];
	if (!viewportApi) {
		Logger.warn("AR action skipped: viewport not found.");
		return;
	}
	if (!viewportApi.viewableInAR()) {
		try {
			const arLink = await viewportApi.createArSessionLink();
			await useAppBuilderActionArQrStore.getState().open({arLink});
		} catch (e) {
			Logger.error(e);
			await useAppBuilderActionArQrStore.getState().open({
				error: "Error while creating QR code",
			});
			throw e;
		}
		return;
	}
	const token = viewportApi.addFlag(FLAG_TYPE.BUSY_MODE);
	try {
		await viewportApi.viewInAR();
	} finally {
		viewportApi.removeFlag(token);
	}
}
