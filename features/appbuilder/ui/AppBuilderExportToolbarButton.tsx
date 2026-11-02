import {IShapeDiverExport} from "@AppBuilderLib/entities/export/config/export";
import {resolveExportParameterValues} from "@AppBuilderLib/entities/export/model/resolveExportParameterValues";
import {useExecuteExport} from "@AppBuilderLib/entities/export/model/useExecuteExport";
import type {
	AppBuilderToolbarAlign,
	AppBuilderToolbarSide,
	IAppBuilderActionPropsSetParameterValue,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import AppBuilderToolbarIconButton, {
	AppBuilderToolbarIconButtonThemeStyleProps,
} from "@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton";
import {IconType} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {useCallback, useState} from "react";

type Props = {
	exportData: IShapeDiverExport | undefined;
	/** Session of the export, used to resolve value sources. */
	namespace: string;
	/** Parameter values (literal or value sources) sent with the export. */
	parameterValues?: IAppBuilderActionPropsSetParameterValue[];
	label: string;
	tooltip: string;
	iconType: IconType;
	buttonThemeProps: Partial<AppBuilderToolbarIconButtonThemeStyleProps>;
	disabled?: boolean;
	labelSide?: AppBuilderToolbarSide;
	labelAlign?: AppBuilderToolbarAlign;
};

/**
 * Viewport-style export trigger used by toolbar export refs.
 */
export default function AppBuilderExportToolbarButton({
	exportData,
	namespace,
	parameterValues,
	label,
	tooltip,
	iconType,
	buttonThemeProps,
	disabled,
	labelSide,
	labelAlign,
}: Props) {
	const [loading, setLoading] = useState(false);
	const executeExport = useExecuteExport(exportData);

	const onClick = useCallback(async () => {
		if (disabled) return;
		setLoading(true);
		try {
			await executeExport({
				parameterValues: await resolveExportParameterValues(
					parameterValues,
					namespace,
				),
			});
		} finally {
			setLoading(false);
		}
	}, [disabled, executeExport, parameterValues, namespace]);

	if (!exportData || exportData.definition.hidden) return null;

	return (
		<AppBuilderToolbarIconButton
			label={label}
			tooltipLabel={tooltip}
			iconType={iconType}
			loading={loading}
			disabled={disabled}
			onClick={() => void onClick()}
			{...buttonThemeProps}
			{...(labelSide !== undefined ? {labelSide} : {})}
			{...(labelAlign !== undefined ? {labelAlign} : {})}
		/>
	);
}
