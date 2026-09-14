import {useAppBuilderActionExportParameterValues} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionExportParameterValues";
import {IAppBuilderLegacyActionPropsExportParameterValues} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderLegacyActionPropsExportParameterValues &
	AppBuilderActionRenderProps & {
		namespace: string;
	};

/** Functional component for an "exportParameterValues" action. */
export default function AppBuilderActionExportParameterValuesComponent(
	props: Props,
) {
	const {
		label = "Export parameter values",
		icon = "tabler:download",
		tooltip,
		namespace,
		presentation,
		toolbarButtonProps,
		disabled,
	} = props;
	const {
		trigger,
		disabled: resolvedDisabled,
		loading,
	} = useAppBuilderActionExportParameterValues({namespace, disabled});

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
