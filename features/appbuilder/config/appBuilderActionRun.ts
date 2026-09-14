import {IAppBuilderActionDefinition} from "./appbuilder";

export const DEFAULT_APP_BUILDER_ACTION_VIEWPORT_ID = "viewport_1";
export const DEFAULT_APP_BUILDER_ACTION_FULLSCREEN_ID =
	"viewer-fullscreen-area";

export type AppBuilderActionRunContext = {
	namespace: string;
	viewportId?: string;
	fullscreenId?: string;
	/**
	 * Host-registered executors from `componentContext.actions`.
	 * A matching entry with no `run` suppresses the action (no shared fallback).
	 */
	actionRuns?: AppBuilderActionRunRegistration[];
};

export type AppBuilderActionRunner = (
	definition: IAppBuilderActionDefinition,
	context: AppBuilderActionRunContext,
) => void | Promise<void>;

export type AppBuilderActionRunRegistration = {
	isAction: (action: IAppBuilderActionDefinition) => boolean;
	run?: AppBuilderActionRunner;
};

export function resolvedViewportId(
	context: AppBuilderActionRunContext,
): string {
	return context.viewportId ?? DEFAULT_APP_BUILDER_ACTION_VIEWPORT_ID;
}

export function resolvedFullscreenId(
	context: AppBuilderActionRunContext,
): string {
	return context.fullscreenId ?? DEFAULT_APP_BUILDER_ACTION_FULLSCREEN_ID;
}

export function collectActionRuns(
	actions?: Record<string, AppBuilderActionRunRegistration>,
): AppBuilderActionRunRegistration[] {
	if (!actions) return [];
	return Object.values(actions).map(({isAction, run}) => ({isAction, run}));
}
