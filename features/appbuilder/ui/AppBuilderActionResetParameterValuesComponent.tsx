import {useAppBuilderActionResetParameterValues} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionResetParameterValues";
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
	const {
		trigger,
		disabled: resolvedDisabled,
		loading,
	} = useAppBuilderActionResetParameterValues({namespace, disabled});

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={() => void trigger()}
			loading={loading}
			disabled={resolvedDisabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
