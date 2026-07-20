import {useParameterImportExport} from "@AppBuilderLib/entities/parameter/model/useParameterImportExport";
import {useCallback, useState} from "react";
import {IAppBuilderActionPropsCommon} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderActionPropsCommon &
	AppBuilderActionRenderProps & {
		namespace: string;
	};

export default function AppBuilderActionResetParameterValuesComponent(
	props: Props,
) {
	const {
		label = "Reset to default parameters",
		icon = "tabler:reload",
		tooltip,
		namespace,
		disabled,
		presentation,
		toolbarButtonProps,
	} = props;
	const {resetParameters} = useParameterImportExport(namespace);
	const [loading, setLoading] = useState(false);
	const isDisabled = !namespace || !!disabled;

	const onClick = useCallback(async () => {
		setLoading(true);
		try {
			await resetParameters();
		} finally {
			setLoading(false);
		}
	}, [resetParameters]);

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={() => void onClick()}
			loading={loading}
			disabled={isDisabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
