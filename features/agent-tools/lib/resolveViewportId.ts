/** `parsed.viewportId` if set, else the main viewport. Empty string is treated as missing by callers. */
export function resolveViewportId(
	parsed: {viewportId?: string},
	deps: {getViewportId: () => string},
): string {
	return parsed.viewportId ?? deps.getViewportId();
}
