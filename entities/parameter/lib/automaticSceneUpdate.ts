export const DEFAULT_AUTOMATIC_SCENE_UPDATE_TIMEOUT = 500;

export type AutomaticSceneUpdateSettings = {
	automaticSceneUpdate?: boolean;
	automaticSceneUpdateTimeout?: number;
};

/**
 * Resolve the automaticSceneUpdate settings of an interaction or drawing
 * parameter. Automatic scene updates are only supported for tools which are
 * always active.
 */
export const resolveAutomaticSceneUpdate = (
	settings: AutomaticSceneUpdateSettings | null | undefined,
	alwaysActive: boolean,
): {enabled: boolean; timeout: number} => ({
	enabled: alwaysActive && settings?.automaticSceneUpdate === true,
	timeout:
		settings?.automaticSceneUpdateTimeout ??
		DEFAULT_AUTOMATIC_SCENE_UPDATE_TIMEOUT,
});
