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

/** Properties for `selectionchange`. */
export interface IAppBuilderActionSlotEventPropsSelection {
	/** Scene node name filters (same meaning as selection parameter `nameFilter`). */
	nameFilter?: string[];
	/** Viewport to listen to. Defaults to the default viewport. */
	viewportId?: string;
}

/**
 * Optional filters for which source an application event applies to.
 * Omit on pointer/`click` slots. Needed only when the app has more
 * than one session, export, or viewport.
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
 * `action.props`. One action per event; multiple actions are SS-9952 sequences.
 */
export interface IAppBuilderActionSlot {
	/** Action executed when the event occurs. */
	action: IAppBuilderActionDefinition;
	/** Optional source filters. Application events only; omit for UI events. */
	eventProps?: IAppBuilderActionSlotEventProps;
}

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
 * Initial application events (extensible). Allowed on the root `IAppBuilder` only.
 */
export type AppBuilderApplicationEvent =
	| "appready"
	| "computationstart"
	| "computationend"
	| "computationerror"
	| "exportstart"
	| "exportend"
	| "exporterror"
	| "selectionchange";

/**
 * Custom events emitted by host or custom components.
 * JSON names must match `custom:` followed by lowercase kebab-case (`custom:item-selected`).
 */
export type AppBuilderCustomEventName = `custom:${string}`;

export type AppBuilderKnownEvent =
	| AppBuilderUiEvent
	| AppBuilderApplicationEvent;

/**
 * One optional slot per event name.
 * Which events a node may use is enforced by `AppBuilderActionSlots` (allowlist
 * + ignored-slot log), not by this type. Custom events use the `custom:` prefix.
 */
export type IAppBuilderActionSlots = Partial<
	Record<AppBuilderKnownEvent, IAppBuilderActionSlot>
> & {
	[eventName: AppBuilderCustomEventName]: IAppBuilderActionSlot | undefined;
};
