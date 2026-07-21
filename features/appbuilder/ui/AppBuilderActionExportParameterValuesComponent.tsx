import {useParameterImportExport} from "@AppBuilderLib/entities/parameter/model/useParameterImportExport";
import {useCallback, useState} from "react";
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
	const {exportParameters} = useParameterImportExport(namespace);
	const [loading, setLoading] = useState(false);

	const onClick = useCallback(async () => {
		if (disabled) return;
		setLoading(true);
		try {
			await exportParameters();
		} finally {
			setLoading(false);
		}
	}, [disabled, exportParameters]);

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={() => void onClick()}
			loading={loading}
			disabled={disabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
