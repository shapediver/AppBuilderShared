import {isIPhone} from "@AppBuilderLib/shared/lib/navigator";
import React from "react";
import {CommonButtonProps} from "../config/types";
import {useFullscreen} from "../model/useFullscreen";
import ViewportIconButton from "./ViewportIconButton";

interface FullscreenButtonProps extends CommonButtonProps {
	fullscreenId?: string;
}

export default function FullscreenButton({
	fullscreenId = "viewer-fullscreen-area",
}: FullscreenButtonProps) {
	const isFullscreenDisabled = isIPhone();
	const {makeElementFullscreen, isFullScreenAvailable} =
		useFullscreen(fullscreenId);
	const disabled = isFullscreenDisabled || !isFullScreenAvailable.current;

	return (
		<ViewportIconButton
			iconType="tabler:maximize"
			label="Fullscreen"
			onClick={makeElementFullscreen}
			disabled={disabled}
		/>
	);
}
