import {PropsExport} from "@AppBuilderLib/entities/export/config/propsExport";
import {useExports} from "@AppBuilderLib/entities/export/model/useExports";
import {AppBuilderToolbarButtonThemeDefaultProps} from "@AppBuilderLib/features/appbuilder/config/AppBuilderToolbarButton.theme.types";
import {ButtonRenderContext} from "@AppBuilderLib/features/appbuilder/config/componentTypes";
import type {ToolbarExportItem} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import {useProps} from "@mantine/core";
import {useMemo} from "react";
import AppBuilderExportToolbarButton from "./AppBuilderExportToolbarButton";
import {AppBuilderToolbarIconButtonDefaultStyleProps} from "./AppBuilderToolbarIconButton";

type Props = {
	item: ToolbarExportItem;
	buttonRenderContext: ButtonRenderContext;
	defaultIcon?: ToolbarExportItem["icon"];
};

/** Adapts an export reference to the standard toolbar-icon presentation. */
export default function AppBuilderToolbarExportButton({
	item,
	buttonRenderContext,
	defaultIcon,
}: Props) {
	const exportProps = useMemo<PropsExport[]>(
		() => [
			{
				namespace:
					item.props.sessionId ?? buttonRenderContext.namespace,
				exportId: item.props.name,
				overrides: item.props.overrides,
				parameterValues: item.props.parameterValues,
			},
		],
		[buttonRenderContext.namespace, item],
	);
	const exports = useExports(exportProps);
	const buttonThemeProps = useProps(
		"AppBuilderToolbarButton",
		{
			...AppBuilderToolbarIconButtonDefaultStyleProps,
			tooltipWrapperProps: {},
		},
		{},
	) as AppBuilderToolbarButtonThemeDefaultProps;
	const disabled =
		buttonRenderContext.buttonsDisabled ||
		buttonRenderContext.executing ||
		buttonRenderContext.hasPendingChanges ||
		item.disabled;

	return (
		<AppBuilderExportToolbarButton
			exportData={exports[0]}
			label={item.label}
			tooltip={item.tooltip ?? item.label}
			iconType={
				item.icon ?? defaultIcon ?? item.label.slice(0, 1).toUpperCase()
			}
			buttonThemeProps={buttonThemeProps}
			disabled={disabled}
		/>
	);
}
