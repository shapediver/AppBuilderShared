import {
	AppBuilderWidgetType,
	IAppBuilder,
	IAppBuilderControl,
	IAppBuilderParameterRef,
	IAppBuilderWidget,
	isAccordionUiWidget,
	isAccordionWidget,
	isControlsWidget,
	isFormWidget,
	isParameterRefControl,
	isStackUiWidget,
} from "../config/appbuilder";

/**
 * Compile-time exhaustiveness guard for {@link parameterRefsFromWidget}.
 * If `AppBuilderWidgetType` gains a new member without a matching `switch` case,
 * TypeScript reports an error on the `never` assignment in the default branch.
 */
function assertNever(value: never): never {
	throw new Error(`Unhandled case: ${String(value)}`);
}

/**
 * Maps parameter-type controls to {@link IAppBuilderParameterRef} entries.
 * Export, action, and output controls are ignored.
 *
 * @param controls - Control list from a form or controls widget.
 * @returns Parameter refs derived from `type: "parameter"` controls.
 */
function parameterRefsFromControls(
	controls: IAppBuilderControl[] | undefined,
): IAppBuilderParameterRef[] {
	if (!controls) {
		return [];
	}

	return controls.filter(isParameterRefControl).map((control) => ({
		name: control.props.name,
		sessionId: control.props.sessionId,
		overrides: control.props.overrides,
		disableIfDirty: control.props.disableIfDirty,
		acceptRejectMode: control.props.acceptRejectMode,
	}));
}

/**
 * Collects parameter references declared by a single widget.
 *
 * Uses an exhaustive `switch` on widget `type` so new widget types
 * must be handled here (or explicitly grouped as non-parameter-bearing).
 *
 * Container widgets (`accordionUi`, `stackUi`) recurse into nested children.
 */
function parameterRefsFromWidget(
	widget: IAppBuilderWidget,
): IAppBuilderParameterRef[] {
	switch (widget.type) {
		case AppBuilderWidgetType.Accordion:
			return isAccordionWidget(widget) && widget.props.parameters
				? [...widget.props.parameters]
				: [];
		case AppBuilderWidgetType.Form: {
			if (!isFormWidget(widget)) {
				return [];
			}
			const refs: IAppBuilderParameterRef[] = [];
			if (widget.props.parameters) {
				refs.push(...widget.props.parameters);
			}
			refs.push(...parameterRefsFromControls(widget.props.controls));
			return refs;
		}
		case AppBuilderWidgetType.Controls:
			return isControlsWidget(widget)
				? parameterRefsFromControls(widget.props.controls)
				: [];
		case AppBuilderWidgetType.AccordionUi:
			return isAccordionUiWidget(widget)
				? widget.props.items.flatMap((item) =>
						item.widgets.flatMap(parameterRefsFromWidget),
					)
				: [];
		case AppBuilderWidgetType.StackUi:
			return isStackUiWidget(widget)
				? widget.props.widgets.flatMap(parameterRefsFromWidget)
				: [];
		case AppBuilderWidgetType.Text:
		case AppBuilderWidgetType.Image:
		case AppBuilderWidgetType.RoundChart:
		case AppBuilderWidgetType.LineChart:
		case AppBuilderWidgetType.AreaChart:
		case AppBuilderWidgetType.BarChart:
		case AppBuilderWidgetType.Actions:
		case AppBuilderWidgetType.AttributeVisualization:
		case AppBuilderWidgetType.Agent:
		case AppBuilderWidgetType.Progress:
		case AppBuilderWidgetType.DesktopClientSelection:
		case AppBuilderWidgetType.DesktopClientOutputs:
		case AppBuilderWidgetType.SavedStates:
		case AppBuilderWidgetType.SceneTreeExplorer:
		case AppBuilderWidgetType.Table:
			return [];
		default: {
			const unhandledType: never = widget.type;
			return assertNever(unhandledType);
		}
	}
}

/**
 * Returns all parameter references placed in the App Builder UI layout.
 *
 * Walks every container and tab, collecting refs from accordion, form, controls,
 * and nested stack/accordion-ui widgets. Used to determine which session parameters are shown in
 * the configurator (e.g. in-app agent context).
 *
 * @param data - Parsed App Builder settings / layout tree.
 * @returns Refs ordered by first appearance in the layout (duplicates preserved if a parameter is placed in multiple widgets).
 */
export function getUiParameterRefs(data: IAppBuilder): IAppBuilderParameterRef[] {
	const refs: IAppBuilderParameterRef[] = [];

	for (const container of data.containers) {
		if (container.widgets) {
			for (const widget of container.widgets) {
				refs.push(...parameterRefsFromWidget(widget));
			}
		}
		if (container.tabs) {
			for (const tab of container.tabs) {
				for (const widget of tab.widgets) {
					refs.push(...parameterRefsFromWidget(widget));
				}
			}
		}
	}

	return refs;
}
