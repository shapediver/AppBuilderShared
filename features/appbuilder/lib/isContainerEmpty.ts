import type {IShapeDiverParameterDefinition} from "@AppBuilderLib/entities/parameter/config/parameter";
import {resolveInteractionPresentation} from "@AppBuilderLib/entities/parameter/model/interaction/resolveInteractionPresentation";
import {applyOverrides} from "@AppBuilderLib/lib/mergeOverrides";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import {
	type IAppBuilderControlParameterRef,
	type IAppBuilderWidget,
	isControlsWidget,
	isParameterRefControl,
	isTextWidget,
} from "../config/appbuilder";

/**
 * Looks up the definition of a parameter referenced by a control (by id,
 * name or display name, like the parameter store does).
 */
export type ParameterDefinitionLookup = (
	namespace: string,
	parameterId: string,
) => IShapeDiverParameterDefinition | undefined;

/** Interaction parameters which render nothing when presented in the toolbar. */
const TOOLBAR_INTERACTION_TYPES = new Set([
	"selection",
	"gumball",
	"rectangleTransform",
	"drawing",
]);

type InteractionSettings = {
	type?: string;
	props?: {
		activeMode?: string;
		presentation?: "widget" | "toolbar";
		general?: {activeMode?: string; presentation?: "widget" | "toolbar"};
	};
};

/**
 * Whether a parameter control renders nothing: the parameter is unknown
 * (not rendered by the controls widget), hidden, or an interaction parameter
 * presented in the toolbar (always active by default, see
 * {@link resolveInteractionPresentation}; the drawing keeps these settings
 * in `general`).
 */
export function isParameterControlEmpty(
	definition: IShapeDiverParameterDefinition | undefined,
	control: IAppBuilderControlParameterRef,
): boolean {
	if (!definition) return true;
	const effective = applyOverrides(definition, control.overrides);
	if (effective.hidden) return true;
	if (effective.type !== PARAMETER_TYPE.INTERACTION) return false;
	const settings = effective.settings as InteractionSettings | undefined;
	if (!settings?.type || !TOOLBAR_INTERACTION_TYPES.has(settings.type))
		return false;
	const props =
		settings.type === "drawing"
			? (settings.props?.general ?? {})
			: (settings.props ?? {});
	return (
		resolveInteractionPresentation(
			props.presentation,
			props.activeMode === "alwaysActive",
		) === "toolbar"
	);
}

/**
 * Whether a widget renders nothing: a text widget without text or markdown,
 * or a controls widget whose controls are all parameters that render nothing.
 * Any other widget counts as content.
 */
export function isWidgetEmpty(
	widget: IAppBuilderWidget,
	namespace: string,
	getDefinition: ParameterDefinitionLookup,
): boolean {
	if (isTextWidget(widget))
		return !widget.props?.text && !widget.props?.markdown;
	if (isControlsWidget(widget))
		return (widget.props?.controls ?? []).every(
			(control) =>
				isParameterRefControl(control) &&
				isParameterControlEmpty(
					getDefinition(
						control.props.sessionId ?? namespace,
						control.props.name,
					),
					control.props,
				),
		);
	return false;
}

/**
 * Whether a container (standard container or anchor) renders nothing: it has
 * no tabs and every widget renders nothing (see {@link isWidgetEmpty}). Such
 * a container is not shown at all: a left container holding only always
 * active interaction parameters presented in the toolbar, or an anchor opened
 * by a selection whose parameter lives in the toolbar, would be an empty
 * panel otherwise.
 */
export function isContainerEmpty(
	container: {tabs?: unknown[]; widgets?: IAppBuilderWidget[]},
	namespace: string,
	getDefinition: ParameterDefinitionLookup,
): boolean {
	if (container.tabs && container.tabs.length > 0) return false;
	return (container.widgets ?? []).every((widget) =>
		isWidgetEmpty(widget, namespace, getDefinition),
	);
}
