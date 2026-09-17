import type {ISelectionParameterProps} from "@shapediver/viewer.shared.types";
import type {IAppBuilderActionDefinition} from "./appbuilder";

/**
 * JSON types for `actionSlots` on {@link IAppBuilderNode} (widgets, tabs,
 * containers, controls, toolbar items, root). Runtime wrappers decide which
 * event names a given node may use; this file only describes the shape.
 */

/** Types of action-slot event filters. */
export type AppBuilderActionSlotEventPropsType =
	| "session"
	| "export"
	| "selection";

/** Properties for session-scoped events (`computation*`). */
export interface IAppBuilderActionSlotEventPropsSession {
	/** Session to listen to. Defaults to the controller session. */
	sessionId?: string;
}

/** Properties for export events (`export*`). */
export interface IAppBuilderActionSlotEventPropsExport extends IAppBuilderActionSlotEventPropsSession {
	/** Export id, name, or displayname. All exports of the session when omitted. */
	name?: string;
}

/**
 * Properties for viewer interaction slots (`selecton`, `selectoff`,
 * `hoveron`, `hoveroff`). Same idea as an anchor container's
 * `selectionProperties`: the slot enables hover/select on matching scene
 * nodes (not a selection parameter). Pair with `setContainerVisibility`
 * to replace `selectionProperties`.
 *
 * `deselectOnEmpty` is always true. `minimumSelection` defaults to 0 and
 * `maximumSelection` to 1 (same as anchors). Viewer multi-select still
 * runs `selecton` / `selectoff` (there is no separate multiSelect slot).
 */
export type IAppBuilderActionSlotEventPropsSelection = Omit<
	ISelectionParameterProps,
	"deselectOnEmpty" | "prompt" | "buttons" | "activeMode" | "presentation"
> & {
	/** Viewport to listen to. Defaults to the default viewport. */
	viewportId?: string;
};

/**
 * Optional filters for which source an application event applies to.
 * Omit on pointer/`click` slots. For interaction events, `nameFilter`
 * chooses which nodes activate the slot (like anchor `selectionProperties`).
 * Session/export/viewport ids are needed only when the app has more than
 * one of those.
 */
export type IAppBuilderActionSlotEventProps =
	| {
			type: "session";
			props: IAppBuilderActionSlotEventPropsSession;
	  }
	| {
			type: "export";
			props: IAppBuilderActionSlotEventPropsExport;
	  }
	| {
			type: "selection";
			props: IAppBuilderActionSlotEventPropsSelection;
	  };

/**
 * Action executed when a node event occurs.
 *
 * The action is static JSON: the triggering event's payload is not passed into
 * `action.props`. Multiple actions in one slot are SS-9952 sequences. Multiple
 * slots for the same event (different `eventProps`) are an array on that event
 * name — see {@link IAppBuilderActionSlots}.
 */
export interface IAppBuilderActionSlot {
	/** Action executed when the event occurs. */
	action: IAppBuilderActionDefinition;
	/** Optional source filters. Application events only; omit for UI events. */
	eventProps?: IAppBuilderActionSlotEventProps;
}

/** One slot or several for the same event (typically different `eventProps`). */
export type IAppBuilderActionSlotList =
	| IAppBuilderActionSlot
	| IAppBuilderActionSlot[];

/**
 * DOM interaction events (extensible). Names match the DOM event, no `on` prefix.
 * `click` is left-click; `contextmenu` is right-click (the wrap calls
 * `preventDefault` so the browser menu does not also open).
 * Allowed on widgets, tabs, containers, controls, toolbar items, and the
 * viewport (root `actionSlots` pointer/`click` attach to the viewport host).
 */
export type AppBuilderUiEvent =
	| "click"
	| "contextmenu"
	| "pointerdown"
	| "pointerup"
	| "pointerenter"
	| "pointerleave";

/**
 * Viewer interaction events on the root `IAppBuilder` only.
 * Names follow other application events (no dots): `selecton` is
 * `EVENTTYPE_INTERACTION.SELECT_ON` and `MULTI_SELECT_ON`.
 */
export type AppBuilderInteractionEvent =
	| "selecton"
	| "selectoff"
	| "hoveron"
	| "hoveroff";

/**
 * Initial application events (extensible). Allowed on the root `IAppBuilder`
 * only. Several slots for one event use an array (different `eventProps`).
 */
export type AppBuilderApplicationEvent =
	| "appready"
	| "computationstart"
	| "computationend"
	| "computationerror"
	| "exportstart"
	| "exportend"
	| "exporterror"
	| AppBuilderInteractionEvent;

/**
 * Custom events emitted by host or custom components.
 * JSON names must match `custom:` followed by lowercase kebab-case (`custom:item-selected`).
 */
export type AppBuilderCustomEventName = `custom:${string}`;

export type AppBuilderKnownEvent =
	| AppBuilderUiEvent
	| AppBuilderApplicationEvent;

/**
 * Slots keyed by event name. A value may be one slot or an array of slots
 * (same event, different `eventProps` — e.g. several `selecton`
 * nameFilters on the App Builder root).
 * Which events a node may use is enforced by `AppBuilderActionSlots` (allowlist
 * + ignored-slot log), not by this type. Custom events use `custom:` +
 * lowercase kebab-case and are dispatched via
 * `dispatchAppBuilderCustomEvent`.
 */
export type IAppBuilderActionSlots = Partial<
	Record<AppBuilderKnownEvent, IAppBuilderActionSlotList>
> & {
	[eventName: AppBuilderCustomEventName]:
		| IAppBuilderActionSlotList
		| undefined;
};
