import {useFullscreen} from "@AppBuilderShared/hooks/ui/useFullscreen";
import React from "react";
import {isIPhone} from "~/shared/utils/misc/navigator";
import {CommonButtonProps} from "./types";
import ViewportIconButton from "./ViewportIconButton";

interface FullscreenButtonProps extends CommonButtonProps {
	fullscreenId?: string;
	enableFullscreenBtn?: boolean;
}

export default function FullscreenButton({
	fullscreenId = "viewer-fullscreen-area",
	enableFullscreenBtn = true,
}: FullscreenButtonProps) {
	const isFullscreenDisabled = !enableFullscreenBtn || isIPhone();
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
