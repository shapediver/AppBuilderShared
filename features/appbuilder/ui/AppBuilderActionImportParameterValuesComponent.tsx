import {useAppBuilderActionImportParameterValues} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionImportParameterValues";
import {IAppBuilderLegacyActionPropsImportParameterValues} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderLegacyActionPropsImportParameterValues &
	AppBuilderActionRenderProps & {
		namespace: string;
	};

/** Functional component for an "importParameterValues" action. */
export default function AppBuilderActionImportParameterValuesComponent(
	props: Props,
) {
	const {
		label = "Import parameter values",
		icon = "tabler:upload",
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
	} = useAppBuilderActionImportParameterValues({namespace, disabled});

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
