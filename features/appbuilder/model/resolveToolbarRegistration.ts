import {
	IAppBuilderToolbarActionItem,
	isToolbarActionMenuItem,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {
	ToolbarItem,
	ToolbarRegistration,
} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
import type {
	ResolvedToolbarRegistration,
	ToolbarActionItem,
	ToolbarExportItem,
	ToolbarMenuModel,
	ToolbarOutputItem,
	ToolbarParameterItem,
	ToolbarRenderItem,
	ToolbarTabsItem,
	ToolbarWidgetsItem,
} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";

const resolveActionItem = (
	item: IAppBuilderToolbarActionItem,
	fallbackId: string,
): ToolbarActionItem => ({
	id: item.id ?? fallbackId,
	type: "action",
	label: item.label ?? item.props.label ?? item.props.definition.type,
	icon: item.icon ?? item.props.icon,
	tooltip: item.tooltip ?? item.props.tooltip,
	presentation: item.presentation,
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
			id: item.id ?? fallbackId,
			type: "menu",
			label: item.label ?? "Toolbar item",
			icon: item.icon,
			tooltip: item.tooltip,
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
		case "parameter": {
			const resolved: ToolbarParameterItem = {
				id: item.id ?? fallbackId,
				type: "parameter",
				label: item.label ?? item.props.name,
				icon: item.icon,
				tooltip: item.tooltip,
				props: item.props,
			};
			return resolved;
		}
		case "export": {
			const resolved: ToolbarExportItem = {
				id: item.id ?? fallbackId,
				type: "export",
				label: item.label ?? item.props.name,
				icon: item.icon,
				tooltip: item.tooltip,
				props: item.props,
			};
			return resolved;
		}
		case "output": {
			const resolved: ToolbarOutputItem = {
				id: item.id ?? fallbackId,
				type: "output",
				label: item.label ?? item.props.name,
				icon: item.icon,
				tooltip: item.tooltip,
				props: item.props,
			};
			return resolved;
		}
		case "widgets": {
			const resolved: ToolbarWidgetsItem = {
				id: item.id ?? fallbackId,
				type: "widgets",
				label: item.label ?? "Toolbar item",
				icon: item.icon,
				tooltip: item.tooltip,
				props: item.props,
			};
			return resolved;
		}
		case "tabs": {
			const resolved: ToolbarTabsItem = {
				id: item.id ?? fallbackId,
				type: "tabs",
				label: item.label ?? "Toolbar item",
				icon: item.icon,
				tooltip: item.tooltip,
				props: item.props,
			};
			return resolved;
		}
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
