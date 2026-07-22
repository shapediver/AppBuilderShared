import {useParameterImportExport} from "@AppBuilderLib/entities/parameter/model/useParameterImportExport";
import {useCallback, useState} from "react";
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
	const {importParameters} = useParameterImportExport(namespace);
	const [loading, setLoading] = useState(false);

	const onClick = useCallback(async () => {
		if (disabled) return;
		setLoading(true);
		try {
			await importParameters();
		} finally {
			setLoading(false);
		}
	}, [disabled, importParameters]);

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
