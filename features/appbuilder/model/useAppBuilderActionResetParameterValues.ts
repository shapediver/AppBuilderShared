import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {useParameterImportExport} from "@AppBuilderLib/entities/parameter/model/useParameterImportExport";
import {useCallback, useState} from "react";

export interface UseAppBuilderActionResetParameterValuesProps {
	namespace: string;
	disabled?: boolean;
}

/** Logic for the "resetParameterValues" action. Can be used without the action component. */
export function useAppBuilderActionResetParameterValues(
	props: UseAppBuilderActionResetParameterValuesProps,
) {
	const {namespace, disabled} = props;
	const {resetParameters} = useParameterImportExport(namespace);
	const [loading, setLoading] = useState(false);
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const resolvedDisabled = !namespace || !!disabled || hasPendingChanges;

	const trigger = useCallback(async () => {
		setLoading(true);
		try {
			await resetParameters();
		} finally {
			setLoading(false);
		}
	}, [resetParameters]);

	return {
		trigger,
		disabled: resolvedDisabled,
		loading,
	};
}
