import {
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
	throw new Error(`Unhandled widget type: ${String(value)}`);
}

/**
 * Stable deduplication key for a parameter reference.
 * Combines optional `sessionId` and `name` so the same parameter in different sessions stays distinct.
 */
function refKey(
	ref: Pick<IAppBuilderParameterRef, "name" | "sessionId">,
): string {
	return `${ref.sessionId ?? ""}\0${ref.name}`;
}

/**
 * Removes duplicate parameter references while preserving first-seen order.
 * Two refs are equal when both `name` and `sessionId` match.
 */
function dedupeParameterRefs(
	refs: IAppBuilderParameterRef[],
): IAppBuilderParameterRef[] {
	const seen = new Set<string>();
	const result: IAppBuilderParameterRef[] = [];

	for (const ref of refs) {
		const key = refKey(ref);
		if (seen.has(key)) {
			continue;
		}
		seen.add(key);
		result.push(ref);
	}

	return result;
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
		case "accordion":
			return isAccordionWidget(widget) && widget.props.parameters
				? [...widget.props.parameters]
				: [];
		case "form": {
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
		case "controls":
			return isControlsWidget(widget)
				? parameterRefsFromControls(widget.props.controls)
				: [];
		case "accordionUi":
			return isAccordionUiWidget(widget)
				? widget.props.items.flatMap((item) =>
						item.widgets.flatMap(parameterRefsFromWidget),
					)
				: [];
		case "stackUi":
			return isStackUiWidget(widget)
				? widget.props.widgets.flatMap(parameterRefsFromWidget)
				: [];
		case "text":
		case "image":
		case "roundChart":
		case "lineChart":
		case "areaChart":
		case "barChart":
		case "actions":
		case "attributeVisualization":
		case "agent":
		case "progress":
		case "desktopClientSelection":
		case "desktopClientOutputs":
		case "savedStates":
		case "sceneTreeExplorer":
		case "table":
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
 * and nested stack/accordion-ui widgets. Used to determine which session parameters
 * the configurator (e.g. WebMCP `filter: "visible"`, in-app agent context).
 *
 * @param data - Parsed App Builder settings / layout tree.
 * @returns Deduplicated refs ordered by first appearance in the layout.
 */
export function getParameterRefs(data: IAppBuilder): IAppBuilderParameterRef[] {
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

	return dedupeParameterRefs(refs);
}
