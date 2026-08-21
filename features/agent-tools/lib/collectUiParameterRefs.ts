import {
	isAccordionUiWidget,
	isAccordionWidget,
	isControlsWidget,
	isFormWidget,
	isParameterRefControl,
	isStackUiWidget,
	isToolbarContainer,
	isToolbarTabbedPanelItem,
	isToolbarWidgetPanelItem,
	type IAppBuilder,
	type IAppBuilderControl,
	type IAppBuilderParameterRef,
	type IAppBuilderTab,
	type IAppBuilderToolbarItem,
	type IAppBuilderWidget,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

export type UiParameterRef = {name: string; sessionId?: string};

function pushRef(
	refs: UiParameterRef[],
	name: string,
	sessionId?: string,
): void {
	if (sessionId === undefined) {
		refs.push({name});
	} else {
		refs.push({name, sessionId});
	}
}

function collectFromParameterRefs(
	refs: UiParameterRef[],
	parameters?: IAppBuilderParameterRef[],
): void {
	for (const parameter of parameters ?? []) {
		pushRef(refs, parameter.name, parameter.sessionId);
	}
}

function collectFromControls(
	refs: UiParameterRef[],
	controls?: IAppBuilderControl[],
): void {
	for (const control of controls ?? []) {
		if (isParameterRefControl(control)) {
			pushRef(refs, control.props.name, control.props.sessionId);
		}
	}
}

function collectFromWidgets(
	refs: UiParameterRef[],
	widgets?: IAppBuilderWidget[],
): void {
	for (const widget of widgets ?? []) {
		if (isAccordionWidget(widget)) {
			collectFromParameterRefs(refs, widget.props.parameters);
		} else if (isControlsWidget(widget)) {
			collectFromControls(refs, widget.props.controls);
		} else if (isFormWidget(widget)) {
			collectFromParameterRefs(refs, widget.props.parameters);
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
	refs: UiParameterRef[],
	tabs?: IAppBuilderTab[],
): void {
	for (const tab of tabs ?? []) {
		collectFromWidgets(refs, tab.widgets);
	}
}

function collectFromToolbarItems(
	refs: UiParameterRef[],
	items?: IAppBuilderToolbarItem[],
): void {
	for (const item of items ?? []) {
		if (isParameterRefControl(item)) {
			pushRef(refs, item.props.name, item.props.sessionId);
		} else if (isToolbarWidgetPanelItem(item)) {
			collectFromWidgets(refs, item.props.widgets);
		} else if (isToolbarTabbedPanelItem(item)) {
			collectFromTabs(refs, item.props.tabs);
		}
	}
}

export function collectUiParameterRefs(
	appBuilder: IAppBuilder,
): UiParameterRef[] {
	const refs: UiParameterRef[] = [];
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
