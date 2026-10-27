import type {IShapeDiverParameterDefinition} from "@AppBuilderLib/entities/parameter/config/parameter";
import {resolveInteractionPresentation} from "@AppBuilderLib/entities/parameter/model/interaction/resolveInteractionPresentation";
import {applyOverrides} from "@AppBuilderLib/lib/mergeOverrides";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import {
	type IAppBuilderParameterRef,
	type IAppBuilderWidget,
	isAccordionWidget,
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
]);

type InteractionPresentationSettings = {
	activeMode?: string;
	presentation?: "widget" | "toolbar";
};

/**
 * Selection, gumball and rectangle transform (parameter type `Interaction`,
 * told apart by `settings.type`) keep their settings in `props`; the drawing
 * (parameter type `Drawing`) keeps `activeMode` / `presentation` in `general`
 * (see the settings validation of the parameter components).
 */
type InteractionSettings = {
	type?: string;
	props?: InteractionPresentationSettings;
	general?: InteractionPresentationSettings;
};

/**
 * Whether a parameter control renders nothing: the parameter is unknown
 * (not rendered by the controls widget), hidden, or an interaction parameter
 * presented in the toolbar (always active by default, see
 * {@link resolveInteractionPresentation}).
 */
export function isParameterControlEmpty(
	definition: IShapeDiverParameterDefinition | undefined,
	control: {overrides?: Partial<IShapeDiverParameterDefinition>},
): boolean {
	if (!definition) return true;
	const effective = applyOverrides(definition, control.overrides);
	if (effective.hidden) return true;
	const settings = effective.settings as InteractionSettings | undefined;
	let props: InteractionPresentationSettings | undefined;
	if (effective.type === PARAMETER_TYPE.DRAWING) {
		props = settings?.general;
	} else if (
		effective.type === PARAMETER_TYPE.INTERACTION &&
		settings?.type &&
		TOOLBAR_INTERACTION_TYPES.has(settings.type)
	) {
		props = settings.props;
	} else {
		return false;
	}
	props ??= {};
	return (
		resolveInteractionPresentation(
			props.presentation,
			props.activeMode === "alwaysActive",
		) === "toolbar"
	);
}

/**
 * Whether an accordion widget renders nothing: it has no exports and every
 * parameter renders nothing. Unknown and hidden parameters are skipped by the
 * accordion; a visible parameter which renders nothing still gets a group
 * header when its group holds more than one visible parameter (the theme
 * default `avoidSingleComponentGroups` suppresses the header of a single
 * parameter), and a header is content.
 */
function isAccordionEmpty(
	props: {
		parameters?: IAppBuilderParameterRef[];
		exports?: unknown[];
		defaultGroupName?: string;
	},
	namespace: string,
	getDefinition: ParameterDefinitionLookup,
): boolean {
	if (props.exports && props.exports.length > 0) return false;
	const groupCounts = new Map<string, number>();
	for (const ref of props.parameters ?? []) {
		const definition = getDefinition(ref.sessionId ?? namespace, ref.name);
		if (!definition) continue;
		const effective = applyOverrides(definition, ref.overrides);
		if (effective.hidden) continue;
		if (!isParameterControlEmpty(definition, ref)) return false;
		const group =
			effective.group?.id ?? (props.defaultGroupName ? "default" : "");
		if (!group) continue;
		const count = (groupCounts.get(group) ?? 0) + 1;
		if (count > 1) return false;
		groupCounts.set(group, count);
	}
	return true;
}

/**
 * Whether a widget renders nothing: a text widget without text or markdown,
 * a controls widget whose controls are all parameters that render nothing, or
 * an accordion widget without exports whose parameters all render nothing
 * (see {@link isAccordionEmpty}). Any other widget counts as content.
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
	if (isAccordionWidget(widget))
		return isAccordionEmpty(widget.props ?? {}, namespace, getDefinition);
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
