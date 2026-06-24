import type {IAppBuilderExportRef} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import type {ResExport} from "@shapediver/sdk.geometry-api-sdk-v2";
import {fetchText} from "./fetchDataSource";

export type FilterableDatabaseExportRef = Pick<
	IAppBuilderExportRef,
	"name" | "sessionId"
>;

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
		return fetchText(url, `export "${name}"`);
	}
}
