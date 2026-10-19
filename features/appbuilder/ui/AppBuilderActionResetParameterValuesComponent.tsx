import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionResetParameterValues} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionResetParameterValues";
import {useState} from "react";
import {IAppBuilderActionPropsCommon} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderActionPropsCommon &
	AppBuilderActionRenderProps & {
		namespace: string;
	};

export default function AppBuilderActionResetParameterValuesComponent(
	props: Props,
) {
	const {
		label = "Reset to default parameters",
		icon = "tabler:reload",
		tooltip,
		namespace,
		disabled,
		presentation,
		toolbarButtonProps,
	} = props;
	const [loading, setLoading] = useState(false);
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const resolvedDisabled = !namespace || !!disabled || hasPendingChanges;
	const onClick = createActionClickHandler(
		() => runAppBuilderActionResetParameterValues(namespace),
		{disabled: resolvedDisabled, setLoading},
	);

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
			loading={loading}
			disabled={resolvedDisabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
