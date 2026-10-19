import {
	Fullscreen3StatesState,
	useFullscreen as useFullscreen3States,
} from "@AppBuilderLib/entities/viewport/model/useFullscreen3States";
import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {toggleAppBuilderFullscreen} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionFullscreen";
import {
	IAppBuilderActionPropsCommon,
	IAppBuilderActionPropsFullscreen,
} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

const ICON_BY_FULLSCREEN_3_STATE: Record<Fullscreen3StatesState, string> = {
	[Fullscreen3StatesState.DEFAULT]: "tabler:maximize",
	[Fullscreen3StatesState.APP]: "tabler:arrows-maximize",
	[Fullscreen3StatesState.VIEWER]: "tabler:arrows-minimize",
};

const LABEL_BY_FULLSCREEN_3_STATE: Record<Fullscreen3StatesState, string> = {
	[Fullscreen3StatesState.DEFAULT]: "Fullscreen",
	[Fullscreen3StatesState.APP]: "Viewer fullscreen",
	[Fullscreen3StatesState.VIEWER]: "Exit fullscreen",
};

type Props = IAppBuilderActionPropsFullscreen &
	IAppBuilderActionPropsCommon &
	AppBuilderActionRenderProps & {
		namespace: string;
		fullscreenId?: string;
	};

export default function AppBuilderActionFullscreenComponent(props: Props) {
	const {
		label = "Fullscreen",
		icon = "tabler:maximize",
		tooltip,
		type = "fullscreen",
		fullscreenId,
		presentation,
		toolbarButtonProps,
		disabled,
	} = props;
	const resolvedFullscreenId = fullscreenId ?? "viewer-fullscreen-area";
	const {fullscreenState, handleFullscreenClick} =
		useFullscreen3States(resolvedFullscreenId);
	const isFullscreen3States = type === "fullscreen3States";
	const onClick = createActionClickHandler(
		() => {
			if (isFullscreen3States) {
				handleFullscreenClick();
			} else {
				toggleAppBuilderFullscreen(resolvedFullscreenId);
			}
		},
		{disabled},
	);

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={
				isFullscreen3States
					? LABEL_BY_FULLSCREEN_3_STATE[fullscreenState]
					: label
			}
			icon={
				isFullscreen3States
					? ICON_BY_FULLSCREEN_3_STATE[fullscreenState]
					: icon
			}
			tooltip={tooltip}
			onClick={onClick}
			disabled={disabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
