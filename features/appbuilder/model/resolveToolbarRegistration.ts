import {IAppBuilderToolbarActionItem} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
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

const resolveActionItem = (
	item: IAppBuilderToolbarActionItem,
	fallbackId: string,
): ToolbarActionItem => ({
	...item,
	id: item.id ?? fallbackId,
	type: "action",
	label: item.label ?? item.props.label ?? item.props.definition.type,
	icon: item.icon ?? item.props.icon,
	tooltip: item.tooltip ?? item.props.tooltip,
	props: {
		...item.props,
		label: item.label ?? item.props.label,
		icon: item.icon ?? item.props.icon,
		tooltip: item.tooltip ?? item.props.tooltip,
	},
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
			label: item.label ?? "Toolbar item",
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
		case "widgets":
		case "tabs":
			return {
				...item,
				id: item.id ?? fallbackId,
				label:
					item.label ??
					("name" in item.props ? item.props.name : "Toolbar item"),
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
