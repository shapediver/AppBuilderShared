export function resolveViewportId(
	parsed: {viewportId?: string},
	deps: {getViewportId: () => string},
): string {
	return parsed.viewportId ?? deps.getViewportId();
}
