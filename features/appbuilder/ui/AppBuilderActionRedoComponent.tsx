import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionRedo} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionRedo";
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
	const canGoForward = useShapeDiverStoreParameters(
		(state) => state.historyIndex < state.history.length - 1,
	);
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const resolvedDisabled = disabled || hasPendingChanges || !canGoForward;
	const onClick = createActionClickHandler(() => runAppBuilderActionRedo(), {
		disabled: resolvedDisabled,
	});

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
			disabled={resolvedDisabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
