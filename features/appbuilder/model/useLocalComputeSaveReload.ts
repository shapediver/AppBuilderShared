import {useEffect} from "react";
import {
	isLocalComputeModelViewUrl,
	retainLocalComputeSaveConnection,
} from "./localComputeSave";

/**
 * One model view per localhost server. Path variants of the same host and port
 * share the stream that `retainLocalComputeSaveConnection` keeps open.
 */
function serversIn(modelViewUrls: readonly (string | undefined)[]): string[] {
	const byOrigin = new Map<string, string>();
	for (const url of modelViewUrls) {
		if (typeof url !== "string" || !isLocalComputeModelViewUrl(url))
			continue;
		const origin = new URL(url).origin;
		if (!byOrigin.has(origin)) byOrigin.set(origin, url);
	}
	return [...byOrigin.values()].sort();
}

/**
 * Reloads the page when a local Grasshopper document is saved.
 * One connection per localhost server, including when several session hooks
 * name that server. Unsaved edits do not arrive on this stream.
 * Call it with the model view of each session this hook opened.
 */
export function useLocalComputeSaveReload(
	modelViewUrls: readonly (string | undefined)[],
): void {
	const key = serversIn(modelViewUrls).join("\n");
	useEffect(() => {
		if (!key) return;
		const handles = key.split("\n").map((modelViewUrl) =>
			retainLocalComputeSaveConnection(modelViewUrl, () => {
				window.location.reload();
			}),
		);
		return () => {
			handles.forEach((handle) => handle.release());
		};
	}, [key]);
}
