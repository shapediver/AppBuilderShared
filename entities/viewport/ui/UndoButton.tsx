import {useViewportHistory} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportHistory";
import React from "react";
import {CommonButtonProps} from "../config/types";
import ViewportIconButton from "./ViewportIconButton";

interface UndoButtonProps extends CommonButtonProps {
	disabled?: boolean;
	hasPendingChanges: boolean;
	executing: boolean;
}

export default function UndoButton({
	disabled = false,
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
