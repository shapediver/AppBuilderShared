import {useViewportHistory} from "@AppBuilderLib/entities/viewport/model/useViewportHistory";
import {IAppBuilderActionPropsCommon} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderActionPropsCommon &
	AppBuilderActionRenderProps & {
		namespace: string;
	};

export default function AppBuilderActionRedoComponent(props: Props) {
	const {
		label = "Redo",
		icon = "tabler:arrow-forward-up",
		tooltip,
		disabled,
		presentation,
		toolbarButtonProps,
	} = props;
	const {canGoForward, goForward} = useViewportHistory();
	const resolvedDisabled = disabled || !canGoForward;

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={() => {
				if (resolvedDisabled) return;
				goForward();
			}}
			disabled={resolvedDisabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
