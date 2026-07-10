import {
	IAppBuilder,
	IAppBuilderControl,
	IAppBuilderParameterRef,
	IAppBuilderWidget,
	isAccordionWidget,
	isControlsWidget,
	isFormWidget,
	isParameterRefControl,
} from "../config/appbuilder";

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
 * Supported widget types:
 * - `accordion` — `props.parameters`
 * - `form` — `props.parameters` plus parameter controls in `props.controls`
 * - `controls` — parameter controls in `props.controls`
 */
function parameterRefsFromWidget(
	widget: IAppBuilderWidget,
): IAppBuilderParameterRef[] {
	const refs: IAppBuilderParameterRef[] = [];

	if (isAccordionWidget(widget) && widget.props.parameters) {
		refs.push(...widget.props.parameters);
	}

	if (isFormWidget(widget)) {
		if (widget.props.parameters) {
			refs.push(...widget.props.parameters);
		}
		refs.push(...parameterRefsFromControls(widget.props.controls));
	}

	if (isControlsWidget(widget)) {
		refs.push(...parameterRefsFromControls(widget.props.controls));
	}

	return refs;
}

/**
 * Returns all parameter references placed in the App Builder UI layout.
 *
 * Walks every container and tab, collecting refs from accordion, form, and
 * controls widgets. Used to determine which session parameters are shown in
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
