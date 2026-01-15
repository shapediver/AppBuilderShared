import {useFullscreen} from "@AppBuilderShared/hooks/ui/useFullscreen";
import React from "react";
import {isIPhone} from "~/shared/utils/misc/navigator";
import {CommonButtonProps} from "./types";
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
