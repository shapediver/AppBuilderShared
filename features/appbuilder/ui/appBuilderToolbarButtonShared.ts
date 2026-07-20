import {
	IAppBuilderToolbarActionItem,
	IAppBuilderToolbarItem,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

export const getTriggerIconType = (
	icon: IAppBuilderToolbarItem["icon"] | undefined,
	label: string,
) => icon ?? label.slice(0, 1).toUpperCase();

export const getToolbarActionRef = (item: IAppBuilderToolbarActionItem) => ({
	...item.props,
	label: item.label ?? item.props.label,
	icon: item.icon ?? item.props.icon,
	tooltip: item.tooltip ?? item.props.tooltip,
});
