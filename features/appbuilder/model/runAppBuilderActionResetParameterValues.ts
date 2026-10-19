import {resetParameterValues} from "@AppBuilderLib/entities/parameter/lib/parameterImportExport";

/** Reset parameters in the session namespace to their defaults. */
export async function runAppBuilderActionResetParameterValues(
	namespace: string,
): Promise<void> {
	await resetParameterValues(namespace);
}
