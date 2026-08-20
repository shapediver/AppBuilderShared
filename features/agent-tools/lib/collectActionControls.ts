import {
	isAccordionUiWidget,
	isActionRefControl,
	isControlsWidget,
	isFormWidget,
	isStackUiWidget,
	isToolbarActionMenuItem,
	isToolbarContainer,
	isToolbarTabbedPanelItem,
	isToolbarWidgetPanelItem,
	type IAppBuilder,
	type IAppBuilderControl,
	type IAppBuilderControlActionRef,
	type IAppBuilderTab,
	type IAppBuilderToolbarItem,
	type IAppBuilderWidget,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {ListActionControlsToolSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {
	DEFAULT_LIST_ACTION_CONTROL_TYPES,
	type ListedActionControl,
} from "../config/listActionControls";

function identityOf(ref: IAppBuilderControlActionRef): string {
	return ref.id ?? ref.label ?? ref.definition.type;
}

function toListed(ref: IAppBuilderControlActionRef): ListedActionControl {
	const identity = identityOf(ref);
	return {
		id: identity,
		name: ref.label ?? identity,
		type: ref.definition.type,
	};
}

function matchesName(ref: IAppBuilderControlActionRef, name: string): boolean {
	return ref.id === name || ref.label === name;
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

function collectFromToolbarItems(
	refs: IAppBuilderControlActionRef[],
	items?: IAppBuilderToolbarItem[],
): void {
	for (const item of items ?? []) {
		if (isActionRefControl(item)) {
			refs.push(item.props);
		} else if (isToolbarActionMenuItem(item)) {
			for (const section of item.props.sections) {
				collectFromToolbarItems(refs, section);
			}
		} else if (isToolbarWidgetPanelItem(item)) {
			collectFromWidgets(refs, item.props.widgets);
		} else if (isToolbarTabbedPanelItem(item)) {
			collectFromTabs(refs, item.props.tabs);
		}
	}
}

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
				collectFromToolbarItems(refs, group);
			}
		} else {
			collectFromTabs(refs, container.tabs);
			collectFromWidgets(refs, container.widgets);
		}
	}
	return refs;
}

export function collectActionControls(args: {
	appBuilder: IAppBuilder | undefined;
	defaultToolbarActions: IAppBuilderControlActionRef[];
	settings: ListActionControlsToolSettings;
}): ListedActionControl[] {
	const collected = [
		...collectFromAppBuilder(args.appBuilder),
		...args.defaultToolbarActions,
	];

	const explicit = args.settings.actions;
	if (explicit) {
		return collected
			.filter((ref) =>
				explicit.some(
					(wanted) =>
						wanted.name !== undefined &&
						matchesName(ref, wanted.name),
				),
			)
			.map(toListed);
	}

	const types = new Set(
		args.settings.filter?.types ?? DEFAULT_LIST_ACTION_CONTROL_TYPES,
	);
	return collected
		.filter((ref) => types.has(ref.definition.type))
		.map(toListed);
}
