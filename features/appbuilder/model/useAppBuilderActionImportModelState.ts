import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {useCallback, useState} from "react";

export interface UseAppBuilderActionImportModelStateProps {
	namespace: string;
	disabled?: boolean;
}

/** Logic for the "importModelState" action. Can be used without the action component. */
export function useAppBuilderActionImportModelState(
	props: UseAppBuilderActionImportModelStateProps,
) {
	const {namespace, disabled} = props;
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const resolvedDisabled = disabled || hasPendingChanges;
	const [opened, setOpened] = useState(false);

	const trigger = useCallback(() => {
		if (resolvedDisabled) return;
		setOpened(true);
	}, [resolvedDisabled]);

	const close = useCallback(() => {
		setOpened(false);
	}, []);

	return {
		trigger,
		disabled: resolvedDisabled,
		opened,
		close,
	};
}
