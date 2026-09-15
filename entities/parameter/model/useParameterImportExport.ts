import {
	exportParameterValues,
	importParameterValues,
	resetParameterValues,
} from "@AppBuilderLib/entities/parameter/lib/parameterImportExport";
import {useCallback} from "react";

/**
 * Hook for managing parameter import/export and reset functionality.
 */
export function useParameterImportExport(namespace: string) {
	const exportParameters = useCallback(
		() => exportParameterValues(namespace),
		[namespace],
	);
	const importParameters = useCallback(
		() => importParameterValues(namespace),
		[namespace],
	);
	const resetParameters = useCallback(
		() => resetParameterValues(namespace),
		[namespace],
	);

	return {
		exportParameters,
		importParameters,
		resetParameters,
	};
}
