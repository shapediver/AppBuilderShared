import {
	isAccordionUiWidget,
	isActionRefControl,
	isControlsWidget,
	isFormWidget,
	isStackUiWidget,
	isToolbarContainer,
	type AppBuilderActionType,
	type IAppBuilder,
	type IAppBuilderControl,
	type IAppBuilderControlActionRef,
	type IAppBuilderTab,
	type IAppBuilderToolbarActionItem,
	type IAppBuilderWidget,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {
	IAgentActionControlRef,
	ListActionControlsToolSettings,
} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {
	isToolbarActionItem,
	isToolbarActionMenuItem,
	isToolbarMenuModel,
	isToolbarTabbedPanelItem,
	isToolbarWidgetPanelItem,
	type ToolbarItem,
} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
import {
	DEFAULT_LIST_ACTION_CONTROL_TYPES,
	type ListedActionControl,
} from "../config/listActionControls";

/** Listed action id: `id ?? label ?? type`. Trigger match also uses `toListed` name. */
function listedActionId(ref: IAppBuilderControlActionRef): string {
	return ref.id ?? ref.label ?? ref.definition.type;
}

function toListed(ref: IAppBuilderControlActionRef): ListedActionControl {
	const identity = listedActionId(ref);
	return {
		id: identity,
		name: ref.label ?? identity,
		type: ref.definition.type,
	};
}

/** Explicit `actions[].name` match: id or label only — not the type fallback used as listed id. */
function matchesActionIdOrLabel(
	ref: IAppBuilderControlActionRef,
	name: string,
): boolean {
	return ref.id === name || ref.label === name;
}

function listExplicitActionRefs(
	collected: IAppBuilderControlActionRef[],
	explicit: IAgentActionControlRef[],
): IAppBuilderControlActionRef[] {
	const refs: IAppBuilderControlActionRef[] = [];
	for (const wanted of explicit) {
		if (wanted.action) {
			refs.push(wanted.action);
		} else if (wanted.name !== undefined) {
			for (const ref of collected) {
				if (matchesActionIdOrLabel(ref, wanted.name)) {
					refs.push(ref);
				}
			}
		}
	}
	return refs;
}

function collectFromControls(
	refs: IAppBuilderControlActionRef[],
	controls?: IAppBuilderControl[],
): void {
	for (const control of controls ?? []) {
		if (isActionRefControl(control)) {
			refs.push(control.props);
		}
	}
}

function collectFromWidgets(
	refs: IAppBuilderControlActionRef[],
	widgets?: IAppBuilderWidget[],
): void {
	for (const widget of widgets ?? []) {
		if (isControlsWidget(widget)) {
			collectFromControls(refs, widget.props.controls);
		} else if (isFormWidget(widget)) {
			collectFromControls(refs, widget.props.controls);
		} else if (isStackUiWidget(widget)) {
			collectFromWidgets(refs, widget.props.widgets);
		} else if (isAccordionUiWidget(widget)) {
			for (const item of widget.props.items) {
				collectFromWidgets(refs, item.widgets);
			}
		}
	}
}

function collectFromTabs(
	refs: IAppBuilderControlActionRef[],
	tabs?: IAppBuilderTab[],
): void {
	for (const tab of tabs ?? []) {
		collectFromWidgets(refs, tab.widgets);
	}
}

function mergeToolbarActionItem(
	item: IAppBuilderToolbarActionItem,
): IAppBuilderControlActionRef {
	return {
		...item.props,
		label: item.label ?? item.props.label,
		icon: item.icon ?? item.props.icon,
		tooltip: item.tooltip ?? item.props.tooltip,
	};
}

function appendFromToolbarItems(
	refs: IAppBuilderControlActionRef[],
	items?: ToolbarItem[],
): void {
	for (const item of items ?? []) {
		if (isToolbarActionItem(item)) {
			refs.push(mergeToolbarActionItem(item));
		} else if (isToolbarActionMenuItem(item)) {
			for (const section of item.props.sections) {
				appendFromToolbarItems(refs, section);
			}
		} else if (isToolbarMenuModel(item)) {
			for (const section of item.props.sections) {
				appendFromToolbarItems(refs, section.items);
			}
		} else if (isToolbarWidgetPanelItem(item)) {
			collectFromWidgets(refs, item.props.widgets);
		} else if (isToolbarTabbedPanelItem(item)) {
			collectFromTabs(refs, item.props.tabs);
		}
	}
}

export function collectFromToolbarItems(
	items?: ToolbarItem[],
): IAppBuilderControlActionRef[] {
	const refs: IAppBuilderControlActionRef[] = [];
	appendFromToolbarItems(refs, items);
	return refs;
}

type CollectActionControlsArgs = {
	appBuilder: IAppBuilder | undefined;
	defaultToolbarActions: IAppBuilderControlActionRef[];
	settings: ListActionControlsToolSettings;
};

function collectFromAppBuilder(
	appBuilder: IAppBuilder | undefined,
): IAppBuilderControlActionRef[] {
	if (!appBuilder) {
		return [];
	}
	const refs: IAppBuilderControlActionRef[] = [];
	for (const container of appBuilder.containers) {
		if (isToolbarContainer(container)) {
			for (const group of container.groups ?? []) {
				refs.push(...collectFromToolbarItems(group));
			}
		} else {
			collectFromTabs(refs, container.tabs);
			collectFromWidgets(refs, container.widgets);
		}
	}
	return refs;
}

/** UI + default-toolbar action refs, then explicit `settings.actions` or type filter. */
export function collectActionControlRefs(
	args: CollectActionControlsArgs,
): IAppBuilderControlActionRef[] {
	const collected = [
		...collectFromAppBuilder(args.appBuilder),
		...args.defaultToolbarActions,
	];

	const explicit = args.settings.actions;
	if (explicit) {
		return listExplicitActionRefs(collected, explicit);
	}

	const types = new Set<AppBuilderActionType>(
		args.settings.filter?.types ?? DEFAULT_LIST_ACTION_CONTROL_TYPES,
	);
	return collected.filter((ref) => types.has(ref.definition.type));
}

/** First collected ref whose listed id or name equals `name`. */
export function findActionControlByName(
	args: CollectActionControlsArgs,
	name: string,
): IAppBuilderControlActionRef | undefined {
	return collectActionControlRefs(args).find((ref) => {
		const listed = toListed(ref);
		return listed.id === name || listed.name === name;
	});
}

/** Same refs as `collectActionControlRefs`, mapped to `{id, name, type}` for the tool output. */
export function collectActionControls(
	args: CollectActionControlsArgs,
): ListedActionControl[] {
	return collectActionControlRefs(args).map(toListed);
}
