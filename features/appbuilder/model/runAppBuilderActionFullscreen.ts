import {cycleFullscreen3States} from "@AppBuilderLib/entities/viewport/model/useFullscreen3States";
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

	const fullscreenId =
		definition.props.fullscreenId ?? resolvedFullscreenId(context);
	if (definition.props.type === "fullscreen3States") {
		cycleFullscreen3States(fullscreenId);
		return;
	}
	toggleAppBuilderFullscreen(fullscreenId);
}
