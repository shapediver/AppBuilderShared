import {useAppBuilderActionImportModelState} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionImportModelState";
import ImportModelStateDialog from "@AppBuilderLib/features/model-state/ui/ImportModelStateDialog";
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
	const {
		trigger,
		disabled: resolvedDisabled,
		opened,
		close,
	} = useAppBuilderActionImportModelState({namespace, disabled});

	return (
		<>
			<AppBuilderActionBase
				presentation={presentation}
				label={label}
				icon={icon}
				tooltip={tooltip}
				onClick={trigger}
				disabled={resolvedDisabled}
				toolbarButtonProps={toolbarButtonProps}
			/>
			<ImportModelStateDialog
				opened={opened}
				onClose={close}
				namespace={namespace}
			/>
		</>
	);
}
