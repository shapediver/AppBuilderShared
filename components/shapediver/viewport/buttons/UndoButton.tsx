import React from "react";
import {useViewportHistory} from "~/shared/hooks/shapediver/viewer/useViewportHistory";
import {CommonButtonProps} from "./types";
import ViewportIconButton from "./ViewportIconButton";

interface UndoButtonProps extends CommonButtonProps {
	disabled: boolean;
	hasPendingChanges: boolean;
	executing: boolean;
}

export default function UndoButton({
	disabled,
	hasPendingChanges,
	executing,
}: UndoButtonProps) {
	const {canGoBack, goBack} = useViewportHistory();
	const isDisabled = !canGoBack || disabled || executing;

	return (
		<ViewportIconButton
			iconType="tabler:arrow-back-up"
			label={
				hasPendingChanges ? "Accept or reject changes first" : "Undo"
			}
			onClick={goBack}
			disabled={isDisabled}
		/>
	);
}
