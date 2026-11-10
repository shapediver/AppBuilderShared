/**
 * A local Grasshopper server is one document on 127.0.0.1 and its own port.
 * App Builder opens one save stream per such session and reloads the page when
 * that document is saved. A ShapeDiver host never opens the stream.
 */

export const LOCAL_COMPUTE_SAVE_EVENT = "save";

export function isLocalComputeModelViewUrl(
	modelViewUrl: string | undefined,
): boolean {
	if (!modelViewUrl) return false;
	try {
		return new URL(modelViewUrl).hostname === "127.0.0.1";
	} catch {
		return false;
	}
}

export function localComputeEventsUrl(modelViewUrl: string): string {
	const url = new URL(modelViewUrl);
	url.pathname = "/api/v2/events";
	url.search = "";
	url.hash = "";
	return url.toString();
}

export function localComputeSaveShouldReload(
	sessionModelViewUrl: string,
	eventUrl: string,
	eventName: string,
): boolean {
	if (eventName !== LOCAL_COMPUTE_SAVE_EVENT) return false;
	if (!isLocalComputeModelViewUrl(sessionModelViewUrl)) return false;
	try {
		return new URL(sessionModelViewUrl).host === new URL(eventUrl).host;
	} catch {
		return false;
	}
}

export interface LocalComputeSaveSource {
	addEventListener(type: string, listener: () => void): void;
	close(): void;
}

/**
 * Opens the save stream for a localhost model view. Other hosts return a
 * connection that does not subscribe.
 */
export function openLocalComputeSaveConnection(
	modelViewUrl: string,
	reload: () => void,
	openSource: (url: string) => LocalComputeSaveSource = (url) =>
		new EventSource(url),
): {close: () => void} {
	if (!isLocalComputeModelViewUrl(modelViewUrl)) return {close() {}};

	const eventUrl = localComputeEventsUrl(modelViewUrl);
	const source = openSource(eventUrl);
	source.addEventListener(LOCAL_COMPUTE_SAVE_EVENT, () => {
		if (
			localComputeSaveShouldReload(
				modelViewUrl,
				eventUrl,
				LOCAL_COMPUTE_SAVE_EVENT,
			)
		)
			reload();
	});
	return {
		close() {
			source.close();
		},
	};
}
