import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionImportModelState} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionImportModelState";
import {useState} from "react";
import {IAppBuilderLegacyActionPropsImportModelState} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderLegacyActionPropsImportModelState &
	AppBuilderActionRenderProps & {
		namespace: string;
	};

/** Functional component for an "importModelState" action. */
export default function AppBuilderActionImportModelStateComponent(
	props: Props,
) {
	const {
		label = "Import model state",
		icon = "tabler:file-import",
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
		() => runAppBuilderActionImportModelState(namespace),
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
