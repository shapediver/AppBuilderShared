import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {useParameterImportExport} from "@AppBuilderLib/entities/parameter/model/useParameterImportExport";
import {useCallback, useState} from "react";

export interface UseAppBuilderActionExportParameterValuesProps {
	namespace: string;
	disabled?: boolean;
}

/** Logic for the "exportParameterValues" action. Can be used without the action component. */
export function useAppBuilderActionExportParameterValues(
	props: UseAppBuilderActionExportParameterValuesProps,
) {
	const {namespace, disabled} = props;
	const {exportParameters} = useParameterImportExport(namespace);
	const [loading, setLoading] = useState(false);
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const resolvedDisabled = disabled || hasPendingChanges;

	const trigger = useCallback(async () => {
		if (resolvedDisabled) return;
		setLoading(true);
		try {
			await exportParameters();
		} finally {
			setLoading(false);
		}
	}, [exportParameters, resolvedDisabled]);

	return {
		trigger,
		disabled: resolvedDisabled,
		loading,
	};
}
