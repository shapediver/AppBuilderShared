import {useAppBuilderActionUndo} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionUndo";
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
		namespace,
		disabled,
		presentation,
		toolbarButtonProps,
	} = props;
	const {trigger, disabled: resolvedDisabled} = useAppBuilderActionUndo({
		namespace,
		disabled,
	});

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={trigger}
			disabled={resolvedDisabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
