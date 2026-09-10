import {
	isAccordionUiWidget,
	isAccordionWidget,
	isControlsWidget,
	isFormWidget,
	isParameterRefControl,
	isStackUiWidget,
	isToolbarContainer,
	type IAppBuilder,
	type IAppBuilderControl,
	type IAppBuilderParameterRef,
	type IAppBuilderTab,
	type IAppBuilderToolbarItem,
	type IAppBuilderWidget,
} from "../config/appbuilder";
import {
	isToolbarTabbedPanelItem,
	isToolbarWidgetPanelItem,
} from "../config/shapediverStoreToolbars";

/** A parameter reference found in the App Builder data, including its overrides. */
export type CollectedParameterRef = Pick<
	IAppBuilderParameterRef,
	"name" | "sessionId" | "overrides"
>;

function collectFromParameterRefs(
	refs: CollectedParameterRef[],
	parameters?: IAppBuilderParameterRef[],
): void {
	for (const {name, sessionId, overrides} of parameters ?? []) {
		refs.push({name, sessionId, overrides});
	}
}

function collectFromControls(
	refs: CollectedParameterRef[],
	controls?: IAppBuilderControl[],
): void {
	for (const control of controls ?? []) {
		if (isParameterRefControl(control)) {
			const {name, sessionId, overrides} = control.props;
			refs.push({name, sessionId, overrides});
		}
	}
}

function collectFromWidgets(
	refs: CollectedParameterRef[],
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
	refs: CollectedParameterRef[],
	tabs?: IAppBuilderTab[],
): void {
	for (const tab of tabs ?? []) {
		collectFromWidgets(refs, tab.widgets);
	}
}

function collectFromToolbarItems(
	refs: CollectedParameterRef[],
	items?: IAppBuilderToolbarItem[],
): void {
	for (const item of items ?? []) {
		if (isParameterRefControl(item)) {
			const {name, sessionId, overrides} = item.props;
			refs.push({name, sessionId, overrides});
		} else if (isToolbarWidgetPanelItem(item)) {
			collectFromWidgets(refs, item.props.widgets);
		} else if (isToolbarTabbedPanelItem(item)) {
			collectFromTabs(refs, item.props.tabs);
		}
	}
}

/**
 * Collect all parameter references of the App Builder data in document order:
 * accordion, form and controls widgets (including nested stack and accordion
 * UI widgets), tabs, and the items of toolbar containers.
 * Hidden references are included, the result is independent of the rendering.
 */
export function collectParameterRefs(
	appBuilder: IAppBuilder,
): CollectedParameterRef[] {
	const refs: CollectedParameterRef[] = [];
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
