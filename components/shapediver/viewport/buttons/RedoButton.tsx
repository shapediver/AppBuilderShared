import React from "react";
import {useViewportHistory} from "~/shared/hooks/shapediver/viewer/useViewportHistory";
import {CommonButtonProps} from "./types";
import ViewportIconButton from "./ViewportIconButton";

interface RedoButtonProps extends CommonButtonProps {
	disabled: boolean;
	hasPendingChanges: boolean;
	executing: boolean;
}

export default function RedoButton({
	disabled,
	hasPendingChanges,
	executing,
}: RedoButtonProps) {
	const {canGoForward, goForward} = useViewportHistory();
	const isDisabled = !canGoForward || disabled || executing;

	return (
		<ViewportIconButton
			iconType="tabler:arrow-forward-up"
			label={
				hasPendingChanges ? "Accept or reject changes first" : "Redo"
			}
			onClick={goForward}
			disabled={isDisabled}
		/>
	);
}
