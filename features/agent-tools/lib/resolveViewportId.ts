/** Main viewport from deps. Empty string is treated as missing by callers. */
export function resolveViewportId(deps: {getViewportId: () => string}): string {
	return deps.getViewportId();
}
