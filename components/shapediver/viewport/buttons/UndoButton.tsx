import React from "react";
import {useViewportHistory} from "~/shared/hooks/shapediver/viewer/useViewportHistory";
import {CommonButtonProps, IconProps} from "./types";
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
	size = undefined,
	color = IconProps.color,
	colorDisabled = IconProps.colorDisabled,
	variant = IconProps.variant,
	variantDisabled = IconProps.variantDisabled,
	iconStyle = IconProps.style,
}: UndoButtonProps) {
	const {canGoBack, goBack} = useViewportHistory();
	const isDisabled = !canGoBack || disabled || executing;

	return (
		<ViewportIconButton
			iconType={"tabler:arrow-back-up"}
			onClick={goBack}
			disabled={isDisabled}
			size={size}
			color={color}
			colorDisabled={colorDisabled}
			variant={variant}
			variantDisabled={variantDisabled}
			iconStyle={iconStyle}
			tooltip={
				hasPendingChanges ? "Accept or reject changes first" : "Undo"
			}
		/>
	);
}
