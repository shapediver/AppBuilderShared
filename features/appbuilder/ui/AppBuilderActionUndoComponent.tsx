import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionUndo} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionUndo";
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
	const canGoBack = useShapeDiverStoreParameters(
		(state) => state.historyIndex > 0,
	);
	// (changes of the parameter components waiting to be sent: restores a state replacing them)
	const hasPendingChanges = useHasPendingParameterChanges(namespace, false);
	const resolvedDisabled = disabled || hasPendingChanges || !canGoBack;
	const onClick = createActionClickHandler(() => runAppBuilderActionUndo(), {
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
