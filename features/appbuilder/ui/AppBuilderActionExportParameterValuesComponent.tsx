import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionExportParameterValues} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionExportParameterValues";
import {useState} from "react";
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
	const [loading, setLoading] = useState(false);
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const resolvedDisabled = disabled || hasPendingChanges;
	const onClick = createActionClickHandler(
		() => runAppBuilderActionExportParameterValues(namespace),
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
