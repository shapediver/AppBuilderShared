import {useAppBuilderActionRedo} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionRedo";
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
		namespace,
		disabled,
		presentation,
		toolbarButtonProps,
	} = props;
	const {trigger, disabled: resolvedDisabled} = useAppBuilderActionRedo({
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
