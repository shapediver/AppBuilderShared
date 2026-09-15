import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionImportParameterValues} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionImportParameterValues";
import {useState} from "react";
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
	const [loading, setLoading] = useState(false);
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const resolvedDisabled = disabled || hasPendingChanges;
	const onClick = createActionClickHandler(
		() => runAppBuilderActionImportParameterValues(namespace),
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
