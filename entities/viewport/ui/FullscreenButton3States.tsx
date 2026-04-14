import {
	Fullscreen3StatesState,
	useFullscreen as useFullscreen3States,
} from "@AppBuilderLib/entities/viewport/model/useFullscreen3States";
import {isIPhone} from "@AppBuilderLib/shared/lib";
import React, {useMemo} from "react";
import {CommonButtonProps} from "../config";
import ViewportIconButton from "./ViewportIconButton";

interface FullscreenButton3StatesProps extends CommonButtonProps {
	fullscreenId?: string;
}

const ICON_BY_STATE: Record<Fullscreen3StatesState, string> = {
	[Fullscreen3StatesState.DEFAULT]: "tabler:maximize",
	[Fullscreen3StatesState.APP]: "tabler:arrows-maximize",
	[Fullscreen3StatesState.VIEWER]: "tabler:arrows-minimize",
};

const LABEL_BY_STATE: Record<Fullscreen3StatesState, string> = {
	[Fullscreen3StatesState.DEFAULT]: "Fullscreen",
	[Fullscreen3StatesState.APP]: "Viewer fullscreen",
	[Fullscreen3StatesState.VIEWER]: "Exit fullscreen",
};

export default function FullscreenButton3States({
	fullscreenId = "viewer-fullscreen-area",
}: FullscreenButton3StatesProps) {
	const isFullscreenDisabled = isIPhone();
	const {fullscreenState, handleFullscreenClick, isFullScreenAvailable} =
		useFullscreen3States(fullscreenId);
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
