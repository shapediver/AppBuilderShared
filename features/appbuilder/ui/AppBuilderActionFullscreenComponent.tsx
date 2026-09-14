import {useAppBuilderActionFullscreen} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionFullscreen";
import {
	IAppBuilderActionPropsCommon,
	IAppBuilderActionPropsFullscreen,
} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

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
	const {
		trigger,
		label: stateLabel,
		icon: stateIcon,
	} = useAppBuilderActionFullscreen({
		type,
		fullscreenId,
		disabled,
	});

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={stateLabel ?? label}
			icon={stateIcon ?? icon}
			tooltip={tooltip}
			onClick={trigger}
			disabled={disabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
