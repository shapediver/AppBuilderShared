import {useFullscreen} from "@AppBuilderLib/entities/viewport/model/useFullscreen";
import React from "react";
import {isIPhone} from "@AppBuilderLib/shared/lib/navigator";
import {CommonButtonProps} from "../config/types";
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
