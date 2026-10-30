import type {ISelectionParameterProps} from "@shapediver/viewer.shared.types";
import type {IAppBuilderActionDefinition} from "./appbuilder";

/**
 * JSON types for `actionSlots` on App Builder nodes.
 *
 * Which events a node may use, and which `eventProps.type` that event
 * allows, is part of this schema and of the Zod schemas in
 * `appbuildertypecheck.ts`. UI nodes allow pointer, click, contextmenu,
 * and `custom:*`. The root also allows application events.
 */

/** Types of action-slot event filters. */
export type AppBuilderActionSlotEventPropsType =
	"session" | "export" | "selection";

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
	| "deselectOnEmpty"
	| "prompt"
	| "buttons"
	| "activeMode"
	| "presentation"
	| "nameFilter"
> & {
	/**
	 * Nodes that activate this slot. Required. There is no match-all default.
	 */
	nameFilter: string[];
	/** Viewport to listen to. Defaults to the default viewport. */
	viewportId?: string;
};

/**
 * Optional filters for which source an application event applies to.
 * Omit on pointer/`click` slots. Interaction events require `nameFilter`
 * (which nodes activate the slot). Session/export/viewport ids are needed
 * only when the app has more than one of those.
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
 * `action.props`. Multiple actions in one slot are an `executeActions` sequence.
 * Several slots for the same event (different `eventProps`) are an array on
 * that event name.
 */
export interface IAppBuilderPlainActionSlot {
	/** Action executed when the event occurs. */
	action: IAppBuilderActionDefinition;
}

/** `computation*` slot. `eventProps`, when set, must be `type: "session"`. */
export interface IAppBuilderSessionActionSlot extends IAppBuilderPlainActionSlot {
	eventProps?: {
		type: "session";
		props: IAppBuilderActionSlotEventPropsSession;
	};
}

/** `export*` slot. `eventProps`, when set, must be `type: "export"`. */
export interface IAppBuilderExportActionSlot extends IAppBuilderPlainActionSlot {
	eventProps?: {
		type: "export";
		props: IAppBuilderActionSlotEventPropsExport;
	};
}

/**
 * `selecton` / `selectoff` / `hoveron` / `hoveroff` slot.
 * `eventProps` is required and must be `type: "selection"` with a
 * non-empty `nameFilter`.
 */
export interface IAppBuilderSelectionActionSlot extends IAppBuilderPlainActionSlot {
	eventProps: {
		type: "selection";
		props: IAppBuilderActionSlotEventPropsSelection;
	};
}

/** Any slot object. The event name decides which variant is valid. */
export type IAppBuilderActionSlot =
	| IAppBuilderPlainActionSlot
	| IAppBuilderSessionActionSlot
	| IAppBuilderExportActionSlot
	| IAppBuilderSelectionActionSlot;

/** One slot or several for the same event (typically different `eventProps`). */
export type IAppBuilderActionSlotList =
	IAppBuilderActionSlot | IAppBuilderActionSlot[];

type PlainActionSlotList =
	IAppBuilderPlainActionSlot | IAppBuilderPlainActionSlot[];

type SessionActionSlotList =
	IAppBuilderSessionActionSlot | IAppBuilderSessionActionSlot[];

type ExportActionSlotList =
	IAppBuilderExportActionSlot | IAppBuilderExportActionSlot[];

type SelectionActionSlotList =
	IAppBuilderSelectionActionSlot | IAppBuilderSelectionActionSlot[];

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
	"selecton" | "selectoff" | "hoveron" | "hoveroff";

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

/**
 * JSON `custom:` names: `custom:` + lowercase kebab-case
 * (`custom:item-selected`).
 */
export const APP_BUILDER_CUSTOM_EVENT_PATTERN =
	/^custom:[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type AppBuilderKnownEvent =
	AppBuilderUiEvent | AppBuilderApplicationEvent;

/**
 * Slots on widgets, tabs, containers, controls, and toolbar items.
 * These events do not take `eventProps`. `custom:` kebab-case names are
 * also allowed.
 */
export interface IAppBuilderNodeActionSlots {
	click?: PlainActionSlotList;
	contextmenu?: PlainActionSlotList;
	pointerdown?: PlainActionSlotList;
	pointerup?: PlainActionSlotList;
	pointerenter?: PlainActionSlotList;
	pointerleave?: PlainActionSlotList;
	[eventName: AppBuilderCustomEventName]: PlainActionSlotList | undefined;
}

/**
 * Slots on the root `IAppBuilder`.
 *
 * Pointer, click, and contextmenu are included because the viewport is not
 * its own JSON node. Those slots attach to the viewport host. The rest are
 * application events. `eventProps` is only valid on `computation*`
 * (`session`), `export*` (`export`), and select/hover (`selection`).
 * Select/hover slots require `eventProps.props.nameFilter`.
 * A value may be one slot or an array (same event, different `eventProps`).
 * `custom:` kebab-case names are also allowed.
 */
export interface IAppBuilderRootActionSlots {
	click?: PlainActionSlotList;
	contextmenu?: PlainActionSlotList;
	pointerdown?: PlainActionSlotList;
	pointerup?: PlainActionSlotList;
	pointerenter?: PlainActionSlotList;
	pointerleave?: PlainActionSlotList;
	appready?: PlainActionSlotList;
	computationstart?: SessionActionSlotList;
	computationend?: SessionActionSlotList;
	computationerror?: SessionActionSlotList;
	exportstart?: ExportActionSlotList;
	exportend?: ExportActionSlotList;
	exporterror?: ExportActionSlotList;
	selecton?: SelectionActionSlotList;
	selectoff?: SelectionActionSlotList;
	hoveron?: SelectionActionSlotList;
	hoveroff?: SelectionActionSlotList;
	[eventName: AppBuilderCustomEventName]: PlainActionSlotList | undefined;
}

/**
 * Widest slot map (the root). UI slot maps are assignable to this.
 * Runtime helpers accept it; JSON validation uses the narrower map for
 * each node kind.
 */
export type IAppBuilderActionSlots = IAppBuilderRootActionSlots;
