/**
 * TEMPORARY debug log of the automatic scene updates (SS-10024, doubled
 * translation in the Salem model). Remove once the issue is found.
 *
 * Every entry is a single string (the data is stringified): the console is
 * opened after the issue happened, a logged object would be shown with its
 * state at that time instead of the state when it was logged. Filter the
 * console by "[SS-10024]".
 */
export function debugSceneUpdateLog(event: string, data?: unknown): void {
	let serialized = "";
	if (data !== undefined) {
		try {
			serialized = ` ${JSON.stringify(data)}`;
		} catch {
			serialized = ` ${String(data)}`;
		}
	}
	// eslint-disable-next-line no-console
	console.log(`[SS-10024] ${new Date().toISOString()} ${event}${serialized}`);
}
