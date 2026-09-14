import {
	IAppBuilderActionDefinition,
	isFullscreenAction,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	AppBuilderActionRunContext,
	resolvedFullscreenId,
} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {Logger} from "@AppBuilderLib/shared/lib/logger";

export function toggleAppBuilderFullscreen(fullscreenId: string): void {
	const doc = document;
	if (doc.fullscreenElement) {
		void doc.exitFullscreen();
		return;
	}
	const element = doc.getElementsByClassName(fullscreenId).item(0);
	if (!element) {
		Logger.warn(`Fullscreen element with ID ${fullscreenId} not found.`);
		return;
	}
	void element.requestFullscreen();
}

/** Default fullscreen executor. Register from the host `componentContext`. */
export async function runAppBuilderActionFullscreen(
	definition: IAppBuilderActionDefinition,
	context: AppBuilderActionRunContext,
): Promise<void> {
	if (!isFullscreenAction(definition)) return;

	if (definition.props.type === "fullscreen3States") {
		Logger.warn(
			"fullscreen3States cycling requires the fullscreen action component; using binary fullscreen.",
		);
	}
	toggleAppBuilderFullscreen(
		definition.props.fullscreenId ?? resolvedFullscreenId(context),
	);
}
