/**
 * A local Grasshopper server is one document. It is reached at 127.0.0.1, or
 * through the Cloudflare quick tunnel that stands in front of that port.
 * App Builder watches one server and reloads the page when that document is
 * saved. A direct connection uses a server-sent event stream. A quick tunnel
 * buffers that stream until it closes, so the tunnel waits on a poll that
 * completes when the document is saved. A ShapeDiver host is never watched.
 */

export const LOCAL_COMPUTE_SAVE_EVENT = "save";

export function isLocalComputeModelViewUrl(
	modelViewUrl: string | undefined,
): boolean {
	if (!modelViewUrl) return false;
	try {
		const hostname = new URL(modelViewUrl).hostname;
		return (
			hostname === "127.0.0.1" || hostname.endsWith(".trycloudflare.com")
		);
	} catch {
		return false;
	}
}

export function localComputeEventsUrl(modelViewUrl: string): string {
	return localComputeEventsPath(modelViewUrl, "/api/v2/events");
}

export function localComputeEventsPollUrl(modelViewUrl: string): string {
	return localComputeEventsPath(modelViewUrl, "/api/v2/events/poll");
}

function localComputeEventsPath(
	modelViewUrl: string,
	pathname: string,
): string {
	const url = new URL(modelViewUrl);
	url.pathname = pathname;
	url.search = "";
	url.hash = "";
	return url.toString();
}

function quickTunnel(modelViewUrl: string): boolean {
	return new URL(modelViewUrl).hostname.endsWith(".trycloudflare.com");
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
 * One answer of the poll. `generation` counts the saves of that server. The
 * next poll passes it as `since`, so a save between two polls is not missed.
 */
export interface LocalComputeSavePollAnswer {
	event?: string;
	generation?: number;
}

export type LocalComputeSavePoll = (
	url: string,
	signal: AbortSignal,
) => Promise<LocalComputeSavePollAnswer>;

/** The longest wait between two polls of a server that does not answer. */
export const LOCAL_COMPUTE_POLL_RETRY_MAX_MS = 30000;

async function pollLocalComputeSave(
	url: string,
	signal: AbortSignal,
): Promise<LocalComputeSavePollAnswer> {
	const response = await fetch(url, {signal, cache: "no-store"});
	if (!response.ok) throw new Error(String(response.status));
	return (await response.json()) as LocalComputeSavePollAnswer;
}

/**
 * Watches a localhost model view. A quick tunnel is polled, because that
 * edge buffers a server-sent event stream. Other hosts return a connection
 * that does not subscribe.
 */
export function openLocalComputeSaveConnection(
	modelViewUrl: string,
	reload: () => void,
	openSource: (url: string) => LocalComputeSaveSource = (url) =>
		new EventSource(url),
	poll: LocalComputeSavePoll = pollLocalComputeSave,
): {close: () => void} {
	if (!isLocalComputeModelViewUrl(modelViewUrl)) return {close() {}};
	if (quickTunnel(modelViewUrl))
		return openLocalComputeSavePoll(modelViewUrl, reload, poll);

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

function openLocalComputeSavePoll(
	modelViewUrl: string,
	reload: () => void,
	poll: LocalComputeSavePoll,
): {close: () => void} {
	const pollUrl = localComputeEventsPollUrl(modelViewUrl);
	const abort = new AbortController();
	let closed = false;
	const watch = async () => {
		let since: number | undefined;
		let retryMs = 1000;
		while (!closed) {
			try {
				const body = await poll(
					since === undefined ? pollUrl : `${pollUrl}?since=${since}`,
					abort.signal,
				);
				if (closed) return;
				retryMs = 1000;
				if (typeof body?.generation === "number")
					since = body.generation;
				if (
					body?.event === LOCAL_COMPUTE_SAVE_EVENT &&
					localComputeSaveShouldReload(
						modelViewUrl,
						pollUrl,
						LOCAL_COMPUTE_SAVE_EVENT,
					)
				) {
					// The page is going away. Another poll would only reload again.
					reload();
					return;
				}
			} catch {
				if (closed) return;
				// A server that is gone (Rhino closed, tunnel ended) is asked less and less often.
				await new Promise((resolve) => setTimeout(resolve, retryMs));
				retryMs = Math.min(
					retryMs * 2,
					LOCAL_COMPUTE_POLL_RETRY_MAX_MS,
				);
			}
		}
	};
	void watch();
	return {
		close() {
			closed = true;
			abort.abort();
		},
	};
}

/**
 * One open stream per localhost origin. Session hooks retain the same server
 * independently, and the last release closes the stream.
 */
const saveConnections = new Map<string, {count: number; close: () => void}>();

export function retainLocalComputeSaveConnection(
	modelViewUrl: string,
	reload: () => void,
	openSource?: (url: string) => LocalComputeSaveSource,
): {release: () => void} {
	if (!isLocalComputeModelViewUrl(modelViewUrl)) return {release() {}};

	const origin = new URL(modelViewUrl).origin;
	const current = saveConnections.get(origin);
	if (current) current.count += 1;
	else {
		const connection = openLocalComputeSaveConnection(
			modelViewUrl,
			reload,
			openSource,
		);
		saveConnections.set(origin, {
			count: 1,
			close: () => connection.close(),
		});
	}

	let released = false;
	return {
		release() {
			if (released) return;
			released = true;
			const entry = saveConnections.get(origin);
			if (!entry) return;
			entry.count -= 1;
			if (entry.count > 0) return;
			entry.close();
			saveConnections.delete(origin);
		},
	};
}
