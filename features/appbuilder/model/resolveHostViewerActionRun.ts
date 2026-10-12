import {
	isArAction,
	isCameraAction,
	isFullscreenAction,
	type IAppBuilderActionDefinition,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {
	AppBuilderActionRunRegistration,
	AppBuilderActionRunner,
} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";

type HostViewerActionEntry = AppBuilderActionRunRegistration & {
	component?: unknown;
};

/**
 * Headless camera / ar / fullscreen executor for a host action map.
 *
 * Host `run` wins, including a native replacement. `{ isAction }` with no
 * `component` and no `run` skips the action. The ShapeDiver control
 * (`AppBuilderActionCameraComponent` and the AR / fullscreen equivalents)
 * without `run` uses the matching executor, so a host that already renders
 * that control still runs it from agent tools, `executeActions`, and the
 * e-commerce API. Omitting the key, or rendering a different component,
 * returns undefined — those modules stay out of hosts that never register
 * the ShapeDiver control.
 */
export async function resolveHostViewerActionRun(
	definition: IAppBuilderActionDefinition,
	host?: Record<string, HostViewerActionEntry | undefined>,
): Promise<AppBuilderActionRunner | undefined> {
	if (!host) return undefined;
	for (const entry of Object.values(host)) {
		if (!entry?.isAction(definition)) continue;
		if (entry.run) return entry.run;
		if (!entry.component) return undefined;
		return loadShapeDiverViewerRun(definition, entry.component);
	}
	return undefined;
}

async function loadShapeDiverViewerRun(
	definition: IAppBuilderActionDefinition,
	component: unknown,
): Promise<AppBuilderActionRunner | undefined> {
	if (isCameraAction(definition)) {
		const [{runAppBuilderActionCamera}, ui] = await Promise.all([
			import("./runAppBuilderActionCamera"),
			import("../ui/AppBuilderActionCameraComponent"),
		]);
		return component === ui.default ? runAppBuilderActionCamera : undefined;
	}
	if (isArAction(definition)) {
		const [{runAppBuilderActionAr}, ui] = await Promise.all([
			import("./runAppBuilderActionAr"),
			import("../ui/AppBuilderActionArComponent"),
		]);
		return component === ui.default ? runAppBuilderActionAr : undefined;
	}
	if (isFullscreenAction(definition)) {
		const [{runAppBuilderActionFullscreen}, ui] = await Promise.all([
			import("./runAppBuilderActionFullscreen"),
			import("../ui/AppBuilderActionFullscreenComponent"),
		]);
		return component === ui.default
			? runAppBuilderActionFullscreen
			: undefined;
	}
	return undefined;
}
