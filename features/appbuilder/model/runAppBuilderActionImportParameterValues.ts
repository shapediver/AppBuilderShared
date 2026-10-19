import {importParameterValues} from "@AppBuilderLib/entities/parameter/lib/parameterImportExport";

/** Open a file picker and apply imported parameter values. */
export async function runAppBuilderActionImportParameterValues(
	namespace: string,
): Promise<void> {
	await importParameterValues(namespace);
}
