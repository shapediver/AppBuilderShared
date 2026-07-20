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
	const [opened, setOpened] = useState(false);
	const onClick = useCallback(() => {
		if (disabled) return;
		setOpened(true);
	}, [disabled]);

	return (
		<>
			<AppBuilderActionBase
				presentation={presentation}
				label={label}
				icon={icon}
				tooltip={tooltip}
				onClick={onClick}
				disabled={disabled}
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
