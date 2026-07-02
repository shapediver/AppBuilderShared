import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import type {IAppBuilderExportRef} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {ResExport} from "@shapediver/sdk.geometry-api-sdk-v2";
import {fetchText} from "./fetchDataSource";

/** Minimal export reference stored in settings JSON (resolved against the parameter store at runtime). */
export type FilterableDatabaseExportRef = Pick<
	IAppBuilderExportRef,
	"name" | "sessionId"
>;

/** ShapeDiver export responses expose the download URL on the first content entry. */
function resolveExportDownloadUrl(
	exportRef: FilterableDatabaseExportRef,
	result: ResExport,
): string {
	const href = result.content?.[0]?.href;
	if (!href) {
		throw new Error(
			`Export "${exportRef.name}" did not return downloadable content`,
		);
	}
	return href;
}

/**
 * Loads raw database text from a ShapeDiver session export.
 * Uses JWT-aware {@link exportApi.actions.fetch} when available; falls back to plain fetch.
 */
export async function fetchExportText(
	exportRef: FilterableDatabaseExportRef,
): Promise<string> {
	const {name, sessionId} = exportRef;
	if (!sessionId) {
		throw new Error(`Export "${name}" requires sessionId`);
	}

	const exportStore = useShapeDiverStoreParameters
		.getState()
		.getExport(sessionId, name);

	if (!exportStore) {
		throw new Error(
			`Export "${name}" not found for session "${sessionId}"`,
		);
	}

	const exportApi = exportStore.getState();
	const result = await exportApi.actions.request();
	const url = resolveExportDownloadUrl(exportRef, result);

	try {
		const response = await exportApi.actions.fetch(url);
		if (!response.ok) {
			throw new Error(
				`Failed to fetch export "${name}": ${response.status} ${response.statusText}`,
			);
		}
		return response.text();
	} catch {
		// Unauthenticated or CORS-friendly URLs (e.g. public CDN) may work without session JWT.
		return fetchText(url, `export "${name}"`);
	}
}
