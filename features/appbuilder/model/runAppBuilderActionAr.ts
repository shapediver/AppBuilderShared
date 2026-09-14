import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport";
import {
	IAppBuilderActionDefinition,
	isArAction,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	AppBuilderActionRunContext,
	resolvedViewportId,
} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
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
		Logger.warn(
			"AR QR code requires the AR action component; skipping in executeActions.",
		);
		return;
	}
	const token = viewportApi.addFlag(FLAG_TYPE.BUSY_MODE);
	try {
		await viewportApi.viewInAR();
	} finally {
		viewportApi.removeFlag(token);
	}
}
