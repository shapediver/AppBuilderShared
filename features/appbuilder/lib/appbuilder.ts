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

function refKey(
	ref: Pick<IAppBuilderParameterRef, "name" | "sessionId">,
): string {
	return `${ref.sessionId ?? ""}\0${ref.name}`;
}

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
 * Given an App Builder data object, return all parameter references
 * placed in accordion, form, or controls widgets (including tab layouts).
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
