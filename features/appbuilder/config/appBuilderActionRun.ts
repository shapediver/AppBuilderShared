import {IAppBuilderActionDefinition} from "./appbuilder";

export const DEFAULT_APP_BUILDER_ACTION_VIEWPORT_ID = "viewport_1";
export const DEFAULT_APP_BUILDER_ACTION_FULLSCREEN_ID =
	"viewer-fullscreen-area";

export type AppBuilderActionRunContext = {
	namespace: string;
	viewportId?: string;
	fullscreenId?: string;
	/**
	 * Host overlay of `componentContext.actions` (by key). Looked up before
	 * shared defaults. A matching entry with no `run` suppresses the action
	 * (no ShapeDiver fallback) — iJewel can omit `camera` / `ar` /
	 * `fullscreen`, register `{ isAction }` to skip sequences, or supply a
	 * native `run`.
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
