import {createRequestEventBus} from "@AppBuilderLib/shared/lib/requestEvents";

export type ExportRequestEventPhase = "start" | "end" | "error";

export type ExportRequestEventIdentity = {
	sessionId: string;
	id?: string;
	name?: string;
	displayname?: string;
};

export type ExportRequestEvent = ExportRequestEventIdentity & {
	phase: ExportRequestEventPhase;
};

const exportRequestEvents = createRequestEventBus<ExportRequestEventIdentity>();

export function emitExportRequestEvent(event: ExportRequestEvent): void {
	exportRequestEvents.emit(event);
}

export function addExportRequestListener(
	listener: (event: ExportRequestEvent) => void,
): () => void {
	return exportRequestEvents.addListener(listener);
}

/**
 * Notify listeners around a store-backed export request.
 * Viewer `EXPORT_REQUEST` task events do not include session or export identity.
 */
export async function withExportRequestEvents<T>(
	identity: ExportRequestEventIdentity,
	run: () => Promise<T>,
): Promise<T> {
	return exportRequestEvents.wrap(identity, run);
}
