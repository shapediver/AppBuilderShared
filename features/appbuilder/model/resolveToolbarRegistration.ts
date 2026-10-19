import {
	IAppBuilderControlPresentation,
	IAppBuilderToolbarActionItem,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	isToolbarActionMenuItem,
	type ToolbarItem,
	type ToolbarRegistration,
} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
import type {
	ResolvedToolbarRegistration,
	ToolbarActionItem,
	ToolbarMenuModel,
	ToolbarRenderItem,
} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";

const controlPresentation = (
	props: IAppBuilderControlPresentation,
): IAppBuilderControlPresentation => ({
	label: props.label,
	icon: props.icon,
	tooltip: props.tooltip,
	labelSide: props.labelSide,
	labelAlign: props.labelAlign,
});

const resolveActionItem = (
	item: IAppBuilderToolbarActionItem,
	fallbackId: string,
): ToolbarActionItem => ({
	...item,
	id: item.id ?? fallbackId,
	type: "action",
	label: item.props.label ?? item.props.definition.type,
	icon: item.props.icon,
	tooltip: item.props.tooltip,
	labelSide: item.props.labelSide,
	labelAlign: item.props.labelAlign,
	props: item.props,
});

const resolveItem = (
	item: ToolbarItem,
	fallbackId: string,
): ToolbarRenderItem => {
	if (
		item.type === "acceptReject" ||
		item.type === "command" ||
		item.type === "checkbox" ||
		item.type === "menu"
	)
		return item;
	if (isToolbarActionMenuItem(item)) {
		const menu: ToolbarMenuModel = {
			...item,
			id: item.id ?? fallbackId,
			type: "menu",
			...controlPresentation(item.props),
			label: item.props.label ?? "Toolbar item",
			props: {
				sections: item.props.sections.map((section, sectionIndex) => ({
					id: `${item.id ?? fallbackId}-section-${sectionIndex}`,
					items: section.map((action, actionIndex) =>
						resolveActionItem(
							action,
							`${item.id ?? fallbackId}-section-${sectionIndex}-action-${actionIndex}`,
						),
					),
				})),
			},
		};
		return menu;
	}

	switch (item.type) {
		case "action":
			return resolveActionItem(item, fallbackId);
		case "parameter":
		case "export":
		case "output":
			return {
				...item,
				id: item.id ?? fallbackId,
				...controlPresentation(item.props),
				label:
					item.props.label ??
					("name" in item.props ? item.props.name : "Toolbar item"),
			};
		case "widgets":
		case "tabs":
			return {
				...item,
				id: item.id ?? fallbackId,
				...controlPresentation(item.props),
				label: item.props.label ?? "Toolbar item",
			};
	}
};

export const resolveToolbarRegistration = (
	toolbar: ToolbarRegistration,
): ResolvedToolbarRegistration => ({
	...toolbar,
	groups: toolbar.groups.map((group, groupIndex) =>
		group.map((item, itemIndex) =>
			resolveItem(
				item,
				`${toolbar.id}-group-${groupIndex}-item-${itemIndex}`,
			),
		),
	),
});
