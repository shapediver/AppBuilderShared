import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {useViewportHistory} from "@AppBuilderLib/entities/viewport/model/useViewportHistory";
import {useCallback} from "react";

export interface UseAppBuilderActionUndoProps {
	namespace: string;
	disabled?: boolean;
}

/** Logic for the "undo" action. Can be used without the action component. */
export function useAppBuilderActionUndo(props: UseAppBuilderActionUndoProps) {
	const {namespace, disabled} = props;
	const {canGoBack, goBack} = useViewportHistory();
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const resolvedDisabled = disabled || hasPendingChanges || !canGoBack;

	const trigger = useCallback(() => {
		if (resolvedDisabled) return;
		goBack();
	}, [goBack, resolvedDisabled]);

	return {
		trigger,
		disabled: resolvedDisabled,
	};
}
