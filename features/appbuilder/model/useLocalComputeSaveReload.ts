import {useEffect} from "react";
import {
	isLocalComputeModelViewUrl,
	openLocalComputeSaveConnection,
} from "./localComputeSave";

/**
 * Reloads the page when a local Grasshopper document is saved.
 * One connection per localhost model view. Unsaved edits do not arrive on this stream.
 * Call it with the model view of each session this hook opened.
 */
export function useLocalComputeSaveReload(
	modelViewUrls: readonly (string | undefined)[],
): void {
	const key = [
		...new Set(
			modelViewUrls.filter(
				(url): url is string =>
					typeof url === "string" && isLocalComputeModelViewUrl(url),
			),
		),
	].join("\n");
	useEffect(() => {
		if (!key) return;
		const connections = key.split("\n").map((modelViewUrl) =>
			openLocalComputeSaveConnection(modelViewUrl, () => {
				window.location.reload();
			}),
		);
		return () => {
			connections.forEach((connection) => connection.close());
		};
	}, [key]);
}
