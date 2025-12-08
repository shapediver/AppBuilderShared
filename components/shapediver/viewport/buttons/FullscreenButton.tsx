import {
	FullscreenState,
	useFullscreen,
} from "@AppBuilderShared/hooks/ui/useFullscreen";
import React, {useMemo} from "react";
import {isIPhone} from "~/shared/utils/misc/navigator";
import {CommonButtonProps} from "./types";
import ViewportIconButton from "./ViewportIconButton";

interface FullscreenButtonProps extends CommonButtonProps {
	fullscreenId?: string;
}

const ICON_BY_STATE: Record<FullscreenState, string> = {
	[FullscreenState.DEFAULT]: "tabler:maximize",
	[FullscreenState.APP]: "tabler:arrows-maximize",
	[FullscreenState.VIEWER]: "tabler:arrows-minimize",
};

const LABEL_BY_STATE: Record<FullscreenState, string> = {
	[FullscreenState.DEFAULT]: "Fullscreen",
	[FullscreenState.APP]: "Viewer fullscreen",
	[FullscreenState.VIEWER]: "Exit fullscreen",
};

export default function FullscreenButton({
	fullscreenId = "viewer-fullscreen-area",
}: FullscreenButtonProps) {
	const isFullscreenDisabled = isIPhone();
	const {fullscreenState, handleFullscreenClick, isFullScreenAvailable} =
		useFullscreen(fullscreenId);
	const disabled = isFullscreenDisabled || !isFullScreenAvailable.current;

	const iconType = useMemo(
		() => ICON_BY_STATE[fullscreenState],
		[fullscreenState],
	);
	const label = useMemo(
		() => LABEL_BY_STATE[fullscreenState],
		[fullscreenState],
	);

	return (
		<ViewportIconButton
			iconType={iconType}
			label={label}
			onClick={handleFullscreenClick}
			disabled={disabled}
		/>
	);
}
