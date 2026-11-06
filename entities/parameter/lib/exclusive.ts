export type ExclusiveSettings = {
	activeMode?: string;
	exclusive?: boolean;
};

/**
 * Resolve the exclusive setting of a rectangle transform parameter. It is only
 * considered for tools which are always active.
 */
export const resolveExclusive = (
	settings: ExclusiveSettings | null | undefined,
): boolean =>
	settings?.activeMode === "alwaysActive" && settings.exclusive === true;
