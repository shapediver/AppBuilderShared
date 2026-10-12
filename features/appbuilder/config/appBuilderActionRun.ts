import {IAppBuilderActionDefinition} from "./appbuilder";

export const DEFAULT_APP_BUILDER_ACTION_VIEWPORT_ID = "viewport_1";
export const DEFAULT_APP_BUILDER_ACTION_FULLSCREEN_ID =
	"viewer-fullscreen-area";

export type AppBuilderActionRunContext = {
	namespace: string;
	viewportId?: string;
	fullscreenId?: string;
	/**
	 * When true, a missing or invalid camera target throws so API callers
	 * can return `{success: false}`. Toolbar, action slots, and in-app
	 * `executeActions` omit this and warn/skip camera failures.
	 * `setParameterValues` always fails on an invalid item; `updateMode`
	 * chooses whether the valid values in that action are written first.
	 */
	strict?: boolean;
	/**
	 * Host overlay of `componentContext.actions` (by key). Looked up before
	 * shared defaults. A matching entry does not fall through to a shared
	 * default. Host `run` wins. `{ isAction }` with no `component` skips
	 * camera / ar / fullscreen. A ShapeDiver `component` without `run` is
	 * filled in by `resolveHostViewerActionRun`. Omit the key so those
	 * actions stay out of the host.
	 */
	hostActions?: Record<string, AppBuilderActionRunRegistration | undefined>;
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

/**
 * Host entries win (including a key with no `run` / no `component`).
 * Defaults are used only for keys the host did not register.
 */
export function findAppBuilderActionRegistration<
	T extends {
		isAction: (action: IAppBuilderActionDefinition) => boolean;
	},
>(
	definition: IAppBuilderActionDefinition,
	defaults: Record<string, T>,
	host?: Record<string, T | undefined>,
): T | undefined {
	if (host) {
		for (const entry of Object.values(host)) {
			if (entry?.isAction(definition)) return entry;
		}
	}
	for (const [key, entry] of Object.entries(defaults)) {
		if (host?.[key]) continue;
		if (entry.isAction(definition)) return entry;
	}
	return undefined;
}
