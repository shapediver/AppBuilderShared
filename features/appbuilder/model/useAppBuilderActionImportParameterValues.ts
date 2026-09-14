import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {useParameterImportExport} from "@AppBuilderLib/entities/parameter/model/useParameterImportExport";
import {useCallback, useState} from "react";

export interface UseAppBuilderActionImportParameterValuesProps {
	namespace: string;
	disabled?: boolean;
}

/** Logic for the "importParameterValues" action. Can be used without the action component. */
export function useAppBuilderActionImportParameterValues(
	props: UseAppBuilderActionImportParameterValuesProps,
) {
	const {namespace, disabled} = props;
	const {importParameters} = useParameterImportExport(namespace);
	const [loading, setLoading] = useState(false);
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const resolvedDisabled = disabled || hasPendingChanges;

	const trigger = useCallback(async () => {
		if (resolvedDisabled) return;
		setLoading(true);
		try {
			await importParameters();
		} finally {
			setLoading(false);
		}
	}, [importParameters, resolvedDisabled]);

	return {
		trigger,
		disabled: resolvedDisabled,
		loading,
	};
}
