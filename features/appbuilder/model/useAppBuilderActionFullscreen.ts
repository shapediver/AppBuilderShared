import {useFullscreen} from "@AppBuilderLib/entities/viewport/model/useFullscreen";
import {
	Fullscreen3StatesState,
	useFullscreen as useFullscreen3States,
} from "@AppBuilderLib/entities/viewport/model/useFullscreen3States";
import {useCallback} from "react";
import {IAppBuilderActionPropsFullscreen} from "../config/appbuilder";

export const ICON_BY_FULLSCREEN_3_STATE: Record<
	Fullscreen3StatesState,
	string
> = {
	[Fullscreen3StatesState.DEFAULT]: "tabler:maximize",
	[Fullscreen3StatesState.APP]: "tabler:arrows-maximize",
	[Fullscreen3StatesState.VIEWER]: "tabler:arrows-minimize",
};

export const LABEL_BY_FULLSCREEN_3_STATE: Record<
	Fullscreen3StatesState,
	string
> = {
	[Fullscreen3StatesState.DEFAULT]: "Fullscreen",
	[Fullscreen3StatesState.APP]: "Viewer fullscreen",
	[Fullscreen3StatesState.VIEWER]: "Exit fullscreen",
};

export interface UseAppBuilderActionFullscreenProps extends IAppBuilderActionPropsFullscreen {
	fullscreenId?: string;
	disabled?: boolean;
}

/** Logic for the "fullscreen" action. Can be used without the action component. */
export function useAppBuilderActionFullscreen(
	props: UseAppBuilderActionFullscreenProps,
) {
	const {type = "fullscreen", fullscreenId, disabled} = props;
	const resolvedFullscreenId = fullscreenId ?? "viewer-fullscreen-area";
	const {makeElementFullscreen} = useFullscreen(resolvedFullscreenId);
	const {fullscreenState, handleFullscreenClick} =
		useFullscreen3States(resolvedFullscreenId);
	const isFullscreen3States = type === "fullscreen3States";

	const trigger = useCallback(() => {
		if (disabled) return;
		if (isFullscreen3States) {
			handleFullscreenClick();
		} else {
			makeElementFullscreen();
		}
	}, [
		disabled,
		handleFullscreenClick,
		isFullscreen3States,
		makeElementFullscreen,
	]);

	return {
		trigger,
		disabled,
		isFullscreen3States,
		fullscreenState,
		label: isFullscreen3States
			? LABEL_BY_FULLSCREEN_3_STATE[fullscreenState]
			: undefined,
		icon: isFullscreen3States
			? ICON_BY_FULLSCREEN_3_STATE[fullscreenState]
			: undefined,
	};
}
