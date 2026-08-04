import {AppBuilderToolbarButtonThemeDefaultProps} from "@AppBuilderLib/features/appbuilder/config/AppBuilderToolbarButton.theme.types";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {ButtonRenderContext} from "@AppBuilderLib/features/appbuilder/config/componentTypes";
import type {ToolbarActionItem} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import {useProps} from "@mantine/core";
import {useContext} from "react";
import {AppBuilderActionFromType} from "./AppBuilderActionFromType";
import {AppBuilderToolbarIconButtonDefaultStyleProps} from "./AppBuilderToolbarIconButton";

type Props = {
	item: ToolbarActionItem;
	buttonRenderContext: ButtonRenderContext;
};

/** Adapts a declarative action to the standard toolbar-icon presentation. */
export default function AppBuilderToolbarActionButton({
	item,
	buttonRenderContext,
}: Props) {
	const componentContext = useContext(ComponentContext);
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

	return AppBuilderActionFromType(
		item.props,
		buttonRenderContext.namespace,
		item.id,
		componentContext,
		{
			presentation: "toolbarIcon",
			toolbarButtonProps: buttonThemeProps,
			viewportId: buttonRenderContext.viewportId,
			fullscreenId: buttonRenderContext.fullscreenId,
			disabled,
		},
	);
}
