import {exportParameterValues} from "@AppBuilderLib/entities/parameter/lib/parameterImportExport";

/** Download current parameter values as JSON. */
export async function runAppBuilderActionExportParameterValues(
	namespace: string,
): Promise<void> {
	await exportParameterValues(namespace);
}
