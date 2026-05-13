import React from "react";
import {CommonButtonProps} from "../config/types";
import {useViewportHistory} from "../model/useViewportHistory";
import ViewportIconButton from "./ViewportIconButton";

interface RedoButtonProps extends CommonButtonProps {
	disabled?: boolean;
	hasPendingChanges: boolean;
	executing: boolean;
}

export default function RedoButton({
	disabled = false,
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
