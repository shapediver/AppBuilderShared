import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import ImportModelStateDialog from "@AppBuilderLib/features/model-state/ui/ImportModelStateDialog";
import {useCallback, useState} from "react";
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
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const resolvedDisabled = disabled || hasPendingChanges;
	const [opened, setOpened] = useState(false);
	const onClick = useCallback(() => {
		if (resolvedDisabled) return;
		setOpened(true);
	}, [resolvedDisabled]);

	return (
		<>
			<AppBuilderActionBase
				presentation={presentation}
				label={label}
				icon={icon}
				tooltip={tooltip}
				onClick={onClick}
				disabled={resolvedDisabled}
				toolbarButtonProps={toolbarButtonProps}
			/>
			<ImportModelStateDialog
				opened={opened}
				onClose={() => setOpened(false)}
				namespace={namespace}
			/>
		</>
	);
}
