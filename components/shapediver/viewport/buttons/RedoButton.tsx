import React from "react";
import {useViewportHistory} from "~/shared/hooks/shapediver/viewer/useViewportHistory";
import {CommonButtonProps, IconProps} from "./types";
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
	size = undefined,
	color = IconProps.color,
	colorDisabled = IconProps.colorDisabled,
	variant = IconProps.variant,
	variantDisabled = IconProps.variantDisabled,
	iconStyle = IconProps.style,
}: RedoButtonProps) {
	const {canGoForward, goForward} = useViewportHistory();
	const isDisabled = !canGoForward || disabled || executing;

	return (
		<ViewportIconButton
			iconType={"tabler:arrow-forward-up"}
			onClick={goForward}
			disabled={isDisabled}
			size={size}
			color={color}
			colorDisabled={colorDisabled}
			variant={variant}
			variantDisabled={variantDisabled}
			iconStyle={iconStyle}
			tooltip={
				hasPendingChanges ? "Accept or reject changes first" : "Redo"
			}
		/>
	);
}
