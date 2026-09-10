import {IShapeDiverExport} from "@AppBuilderLib/entities/export/config/export";
import {useExecuteExport} from "@AppBuilderLib/entities/export/model/useExecuteExport";
import type {
	AppBuilderToolbarAlign,
	AppBuilderToolbarSide,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import AppBuilderToolbarIconButton, {
	AppBuilderToolbarIconButtonThemeStyleProps,
} from "@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton";
import {IconType} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {useCallback, useState} from "react";

type Props = {
	exportData: IShapeDiverExport | undefined;
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
			await executeExport();
		} finally {
			setLoading(false);
		}
	}, [disabled, executeExport]);

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
