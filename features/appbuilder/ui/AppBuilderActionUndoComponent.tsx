import {useViewportHistory} from "@AppBuilderLib/entities/viewport/model/useViewportHistory";
import {IAppBuilderActionPropsCommon} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderActionPropsCommon &
	AppBuilderActionRenderProps & {
		namespace: string;
	};

export default function AppBuilderActionUndoComponent(props: Props) {
	const {
		label = "Undo",
		icon = "tabler:arrow-back-up",
		tooltip,
		disabled,
		presentation,
		toolbarButtonProps,
	} = props;
	const {canGoBack, goBack} = useViewportHistory();
	const resolvedDisabled = disabled || !canGoBack;

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={() => {
				if (resolvedDisabled) return;
				goBack();
			}}
			disabled={resolvedDisabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
