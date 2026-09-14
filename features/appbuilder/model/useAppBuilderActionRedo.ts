import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {useViewportHistory} from "@AppBuilderLib/entities/viewport/model/useViewportHistory";
import {useCallback} from "react";

export interface UseAppBuilderActionRedoProps {
	namespace: string;
	disabled?: boolean;
}

/** Logic for the "redo" action. Can be used without the action component. */
export function useAppBuilderActionRedo(props: UseAppBuilderActionRedoProps) {
	const {namespace, disabled} = props;
	const {canGoForward, goForward} = useViewportHistory();
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const resolvedDisabled = disabled || hasPendingChanges || !canGoForward;

	const trigger = useCallback(() => {
		if (resolvedDisabled) return;
		goForward();
	}, [goForward, resolvedDisabled]);

	return {
		trigger,
		disabled: resolvedDisabled,
	};
}
