import {useFullscreen} from "@AppBuilderShared/hooks/ui/useFullscreen";
import React from "react";
import {isIPhone} from "~/shared/utils/misc/navigator";
import {CommonButtonProps, IconProps} from "./types";
import ViewportIconButton from "./ViewportIconButton";

interface FullscreenButtonProps extends CommonButtonProps {
	fullscreenId?: string;
	enableFullscreenBtn?: boolean;
}

export default function FullscreenButton({
	fullscreenId = "viewer-fullscreen-area",
	enableFullscreenBtn = true,
	color = IconProps.color,
	colorDisabled = IconProps.colorDisabled,
	size = undefined,
	variant = IconProps.variant,
	variantDisabled = IconProps.variantDisabled,
	iconStyle = IconProps.style,
}: FullscreenButtonProps) {
	const isFullscreenDisabled = !enableFullscreenBtn || isIPhone();
	const {makeElementFullscreen, isFullScreenAvailable} =
		useFullscreen(fullscreenId);
	const disabled = isFullscreenDisabled || !isFullScreenAvailable.current;

	return (
		<ViewportIconButton
			iconType={"tabler:maximize"}
			onClick={makeElementFullscreen}
			disabled={disabled}
			size={size}
			color={color}
			colorDisabled={colorDisabled}
			variant={variant}
			variantDisabled={variantDisabled}
			iconStyle={iconStyle}
			tooltip="Fullscreen"
		/>
	);
}
