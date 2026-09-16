import {Logger} from "@AppBuilderLib/shared/lib/logger";
import type {
	AppBuilderApplicationEvent,
	AppBuilderCustomEventName,
	AppBuilderInteractionEvent,
	AppBuilderUiEvent,
	IAppBuilderActionSlot,
	IAppBuilderActionSlotEventProps,
	IAppBuilderActionSlotEventPropsSelection,
	IAppBuilderActionSlots,
} from "../config/appbuilderActionSlots";

/**
 * Runtime allowlists and matching helpers for action slots.
 *
 * Which events a JSON node may use is not in Zod. Callers pass a list from
 * {@link APP_BUILDER_SLOT_EVENTS} into {@link pickAllowedActionSlots}.
 * UI event names are the keys of {@link APP_BUILDER_UI_EVENT_REACT_PROPS}.
 */

/**
 * DOM event name → React listener prop.
 * {@link APP_BUILDER_UI_EVENTS} is derived from these keys so the two cannot drift.
 */
export const APP_BUILDER_UI_EVENT_REACT_PROPS = {
	click: "onClick",
	contextmenu: "onContextMenu",
	pointerdown: "onPointerDown",
	pointerup: "onPointerUp",
	pointerenter: "onPointerEnter",
	pointerleave: "onPointerLeave",
} as const satisfies Record<AppBuilderUiEvent, string>;

/** Pointer, click, and contextmenu events valid on widgets, tabs, containers, controls, toolbar items, and the viewport host. */
export const APP_BUILDER_UI_EVENTS = Object.keys(
	APP_BUILDER_UI_EVENT_REACT_PROPS,
) as AppBuilderUiEvent[];

/**
 * Viewer interaction slots. Valid on the root `IAppBuilder` only.
 * Viewer `interaction.multiSelect.*` is mapped onto `selecton` / `selectoff`.
 */
export const APP_BUILDER_INTERACTION_EVENTS = [
	"selecton",
	"selectoff",
	"hoveron",
	"hoveroff",
] as const satisfies readonly AppBuilderInteractionEvent[];

/**
 * Map a viewer `EVENTTYPE_INTERACTION` to the JSON slot name.
 * Multi-select on/off runs the same slots as select on/off.
 * `SELECT_OFF` during a reselection is skipped (the following `SELECT_ON`
 * still runs `selecton`). Other interaction types are ignored.
 */
export function mapViewerInteractionEventToSlot(
	viewerEventType: string,
	payload?: {reselection?: boolean},
): AppBuilderInteractionEvent | undefined {
	switch (viewerEventType) {
		case "interaction.select.on":
		case "interaction.multiSelect.on":
			return "selecton";
		case "interaction.select.off":
			if (payload?.reselection) return undefined;
			return "selectoff";
		case "interaction.multiSelect.off":
			return "selectoff";
		case "interaction.hover.on":
			return "hoveron";
		case "interaction.hover.off":
			return "hoveroff";
		default:
			return undefined;
	}
}

/**
 * Application events. `appready`, computation, export, and viewer
 * interaction (`selecton` / `selectoff` / `hoveron` / `hoveroff`) are
 * valid on the root `IAppBuilder` only.
 */
export const APP_BUILDER_APPLICATION_EVENTS: readonly AppBuilderApplicationEvent[] =
	[
		"appready",
		"computationstart",
		"computationend",
		"computationerror",
		"exportstart",
		"exportend",
		"exporterror",
		...APP_BUILDER_INTERACTION_EVENTS,
	];

export function isAppBuilderInteractionEvent(
	eventName: string,
): eventName is AppBuilderInteractionEvent {
	return (APP_BUILDER_INTERACTION_EVENTS as readonly string[]).includes(
		eventName,
	);
}

export function isAppBuilderApplicationEvent(
	eventName: string,
): eventName is AppBuilderApplicationEvent {
	return (APP_BUILDER_APPLICATION_EVENTS as readonly string[]).includes(
		eventName,
	);
}

/** JSON `custom:` names: `custom:` + lowercase kebab-case (`custom:item-selected`). */
const CUSTOM_ACTION_SLOT_EVENT = /^custom:[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isAppBuilderCustomEvent(
	eventName: string,
): eventName is AppBuilderCustomEventName {
	return CUSTOM_ACTION_SLOT_EVENT.test(eventName);
}

const customActionSlotTriggers = new Map<
	string,
	Set<() => void | Promise<void>>
>();

/**
 * Register a `custom:*` slot trigger. Host or custom components call
 * {@link dispatchAppBuilderCustomEvent} with the same name.
 */
export function registerAppBuilderCustomActionSlot(
	eventName: string,
	trigger: () => void | Promise<void>,
): () => void {
	if (!isAppBuilderCustomEvent(eventName)) return () => {};
	let triggers = customActionSlotTriggers.get(eventName);
	if (!triggers) {
		triggers = new Set();
		customActionSlotTriggers.set(eventName, triggers);
	}
	triggers.add(trigger);
	return () => {
		triggers!.delete(trigger);
		if (triggers!.size === 0) customActionSlotTriggers.delete(eventName);
	};
}

/** Run every registered slot for `eventName` (`custom:kebab-case`). */
export function dispatchAppBuilderCustomEvent(eventName: string): void {
	if (!isAppBuilderCustomEvent(eventName)) {
		Logger.warn(
			`"${eventName}" is not a custom action slot event (expected custom:kebab-case).`,
		);
		return;
	}
	const triggers = customActionSlotTriggers.get(eventName);
	if (!triggers || triggers.size === 0) {
		Logger.warn(
			`Custom action slot "${eventName}" has no registered listener.`,
		);
		return;
	}
	for (const trigger of triggers) {
		void Promise.resolve(trigger()).catch((error) => {
			Logger.warn("Action slot failed:", error);
		});
	}
}

/**
 * Per-event `eventProps.type`. Events not listed here do not take
 * `eventProps`; a value on those names is incompatible and the slot is skipped.
 */
export const ACTION_SLOT_EVENT_PROPS_TYPE = {
	computationstart: "session",
	computationend: "session",
	computationerror: "session",
	exportstart: "export",
	exportend: "export",
	exporterror: "export",
	selecton: "selection",
	selectoff: "selection",
	hoveron: "selection",
	hoveroff: "selection",
} as const satisfies Partial<
	Record<AppBuilderApplicationEvent, IAppBuilderActionSlotEventProps["type"]>
>;

export function expectedActionSlotEventPropsType(
	eventName: string,
): IAppBuilderActionSlotEventProps["type"] | undefined {
	return ACTION_SLOT_EVENT_PROPS_TYPE[
		eventName as keyof typeof ACTION_SLOT_EVENT_PROPS_TYPE
	];
}

/**
 * `eventProps` omitted is always valid (unfiltered). Wrong `type` for this
 * event, or `eventProps` on an event that has none, is incompatible.
 */
export function isActionSlotEventPropsCompatible(
	eventName: string,
	slot: IAppBuilderActionSlot,
): boolean {
	if (!slot.eventProps) return true;
	const expected = expectedActionSlotEventPropsType(eventName);
	return expected !== undefined && slot.eventProps.type === expected;
}

function warnIncompatibleActionSlotEventProps(
	eventName: string,
	slot: IAppBuilderActionSlot,
): void {
	const expected = expectedActionSlotEventPropsType(eventName);
	const actual = slot.eventProps?.type;
	if (expected === undefined) {
		Logger.warn(
			`Action slot "${eventName}" does not support eventProps and will be ignored.`,
		);
		return;
	}
	Logger.warn(
		`Action slot "${eventName}" expects eventProps.type "${expected}" but got "${actual}" and will be ignored.`,
	);
}

/** Viewer `TASK_TYPE.SESSION_CUSTOMIZATION` (string to avoid importing the viewer here). */
export const SESSION_CUSTOMIZATION_TASK_TYPE = "session_customization";

/**
 * `ITaskEvent.status` on `TASK_CANCEL` when a session customize actually
 * failed. Other cancels (superseded customizes) use a different status.
 */
export const SESSION_CUSTOMIZATION_FAILED_STATUS =
	"Session customization failed";

export function isSessionCustomizationFailedTask(event: {
	type?: string;
	status?: string;
}): boolean {
	return (
		event.type === SESSION_CUSTOMIZATION_TASK_TYPE &&
		event.status === SESSION_CUSTOMIZATION_FAILED_STATUS
	);
}

/**
 * Events valid on the App Builder root: application events plus viewport
 * pointer/`click` (those attach to the viewport host, not to a UI node).
 */
export const APP_BUILDER_ROOT_EVENTS: readonly string[] = [
	...APP_BUILDER_APPLICATION_EVENTS,
	...APP_BUILDER_UI_EVENTS,
];

/**
 * Per-node event allowlists. UI kinds currently share {@link APP_BUILDER_UI_EVENTS};
 * change one key here when that node should accept extra (or fewer) names.
 * `root` is the ignored-slot log for the App Builder definition (application + viewport UI).
 */
export const APP_BUILDER_SLOT_EVENTS = {
	widget: APP_BUILDER_UI_EVENTS,
	tab: APP_BUILDER_UI_EVENTS,
	container: APP_BUILDER_UI_EVENTS,
	control: APP_BUILDER_UI_EVENTS,
	toolbar: APP_BUILDER_UI_EVENTS,
	viewport: APP_BUILDER_UI_EVENTS,
	application: APP_BUILDER_APPLICATION_EVENTS,
	root: APP_BUILDER_ROOT_EVENTS,
} as const;

/** Trigger map keyed by UI event name. Written by slot runners, read by DOM handlers. */
export type AppBuilderUiSlotHandlers = {
	[K in AppBuilderUiEvent]?: () => void;
};

/** React pointer/`click`/`contextmenu` props produced by {@link uiSlotDomProps}. */
export type AppBuilderUiSlotDomProps = {
	[K in (typeof APP_BUILDER_UI_EVENT_REACT_PROPS)[AppBuilderUiEvent]]?: (event?: {
		preventDefault(): void;
	}) => void;
};

/**
 * Build React listener props for the UI events in `enabledEvents`.
 *
 * Used by the default wrap in `AppBuilderActionSlots` and by tab controls,
 * which cannot wrap `Tabs.Tab` (Mantine requires it as a direct `Tabs.List` child).
 * `contextmenu` calls `preventDefault` so the browser menu does not also open.
 */
export function uiSlotDomProps(
	run: (eventName: AppBuilderUiEvent) => void,
	enabledEvents: ReadonlySet<string> = new Set(APP_BUILDER_UI_EVENTS),
): AppBuilderUiSlotDomProps {
	const props: AppBuilderUiSlotDomProps = {};
	for (const eventName of APP_BUILDER_UI_EVENTS) {
		if (!enabledEvents.has(eventName)) continue;
		props[APP_BUILDER_UI_EVENT_REACT_PROPS[eventName]] = (event) => {
			if (eventName === "contextmenu") event?.preventDefault();
			run(eventName);
		};
	}
	return props;
}

/**
 * Read `eventProps.props` when the slot filter is of `expectedType`.
 * Returns `undefined` when omitted. Incompatible types are skipped before
 * this is called ({@link pickAllowedActionSlots}).
 */
export function getActionSlotEventProps(
	slot: IAppBuilderActionSlot,
	expectedType: IAppBuilderActionSlotEventProps["type"],
): IAppBuilderActionSlotEventProps["props"] | undefined {
	if (!slot.eventProps) return undefined;
	if (slot.eventProps.type !== expectedType) return undefined;
	return slot.eventProps.props;
}

/**
 * Whether a session-scoped event belongs to this slot.
 * `filterSessionId` wins when set; otherwise the controller session is the default.
 * An event with no session id only matches when the slot also has no filter.
 */
export function matchesSessionFilter(
	sessionId: string | undefined,
	filterSessionId: string | undefined,
	fallbackSessionId: string,
): boolean {
	const expected = filterSessionId || fallbackSessionId;
	if (!sessionId) return !filterSessionId;
	return sessionId === expected;
}

/**
 * Whether an export event matches `filterName` (id, name, or displayname, case-insensitive).
 * No filter → all exports of the session.
 */
export function matchesExportName(
	exportIdentity: {
		id?: string;
		name?: string;
		displayname?: string;
	},
	filterName?: string,
): boolean {
	if (!filterName) return true;
	const needle = filterName.toLowerCase();
	return [exportIdentity.id, exportIdentity.name, exportIdentity.displayname]
		.filter((value): value is string => !!value)
		.some((value) => value.toLowerCase() === needle);
}

export type ResolvedActionSlot = {
	eventName: string;
	slot: IAppBuilderActionSlot;
	index: number;
};

/** Flatten one slot or an array of slots. Empty arrays are no slots. */
export function listActionSlots(
	value: IAppBuilderActionSlot | IAppBuilderActionSlot[] | undefined,
): IAppBuilderActionSlot[] {
	if (!value) return [];
	return Array.isArray(value) ? value.filter(Boolean) : [value];
}

/** Handler map key when several slots share an event name. */
export function actionSlotHandlerKey(eventName: string, index: number): string {
	return `${eventName}#${index}`;
}

/**
 * Slots whose event names are in `allowedEvents`, plus valid `custom:*`
 * names when `includeCustomEvents` is true (default). The viewport wrap of
 * root slots passes `includeCustomEvents: false` so root `custom:*` is
 * registered once by application listeners.
 * Arrays on one event name become several {@link ResolvedActionSlot}s.
 * Other names are omitted (see {@link logIgnoredActionSlotEvents}).
 */
export function pickAllowedActionSlots(
	actionSlots: IAppBuilderActionSlots | undefined,
	allowedEvents: readonly string[],
	options?: {includeCustomEvents?: boolean},
): ResolvedActionSlot[] {
	if (!actionSlots) return [];
	const includeCustomEvents = options?.includeCustomEvents !== false;
	const allowed = new Set(allowedEvents);
	const resolved: ResolvedActionSlot[] = [];
	for (const eventName of Object.keys(actionSlots)) {
		if (
			!allowed.has(eventName) &&
			!(includeCustomEvents && isAppBuilderCustomEvent(eventName))
		) {
			continue;
		}
		const listed = listActionSlots(
			(
				actionSlots as Record<
					string,
					IAppBuilderActionSlot | IAppBuilderActionSlot[] | undefined
				>
			)[eventName],
		);
		for (const slot of listed) {
			if (!isActionSlotEventPropsCompatible(eventName, slot)) {
				warnIncompatibleActionSlotEventProps(eventName, slot);
				continue;
			}
			resolved.push({eventName, slot, index: resolved.length});
		}
	}
	return resolved;
}

/**
 * Warn for slots that this node will not run. Valid `custom:*` names are
 * picked by {@link pickAllowedActionSlots} and dispatched via
 * {@link dispatchAppBuilderCustomEvent}.
 */
export function logIgnoredActionSlotEvents(
	actionSlots: IAppBuilderActionSlots | undefined,
	allowedEvents: readonly string[],
	unsupportedOn: string,
): void {
	if (!actionSlots) return;
	const allowed = new Set(allowedEvents);
	for (const eventName of Object.keys(actionSlots)) {
		const listed = listActionSlots(
			(
				actionSlots as Record<
					string,
					IAppBuilderActionSlot | IAppBuilderActionSlot[] | undefined
				>
			)[eventName],
		);
		if (
			listed.length === 0 ||
			allowed.has(eventName) ||
			isAppBuilderCustomEvent(eventName)
		) {
			continue;
		}
		if (eventName.startsWith("custom:")) {
			Logger.warn(
				`Custom action slot "${eventName}" is not a valid custom event name (expected custom:kebab-case) ${unsupportedOn} and will be ignored.`,
			);
		} else {
			Logger.warn(
				`Action slot "${eventName}" is not supported ${unsupportedOn} and will be ignored.`,
			);
		}
	}
}

/**
 * First non-empty string at `keys` on `value`, including one level of nested
 * `{ id | name | sessionId }`. Used to read session id from viewer task `data`
 * without treating a task uuid `id` as a session id.
 */
export function readStringField(
	value: unknown,
	keys: readonly string[],
): string | undefined {
	if (!value || typeof value !== "object") return undefined;
	const record = value as Record<string, unknown>;
	for (const key of keys) {
		const field = record[key];
		if (typeof field === "string" && field.length > 0) return field;
		if (field && typeof field === "object") {
			const nested = readStringField(field, ["id", "name", "sessionId"]);
			if (nested) return nested;
		}
	}
	return undefined;
}

function normalizedNameFilter(
	eventProps: IAppBuilderActionSlotEventPropsSelection | undefined,
): string[] {
	return eventProps?.nameFilter?.length ? eventProps.nameFilter : ["*"];
}

/** Viewport + nameFilter only — used to detect conflicting selection configs. */
export function selectionSlotNameFilterKey(
	eventProps: IAppBuilderActionSlotEventPropsSelection | undefined,
	viewportId: string,
): string {
	return JSON.stringify({
		viewportId: eventProps?.viewportId ?? viewportId,
		nameFilter: normalizedNameFilter(eventProps),
	});
}

/**
 * Full effective `useSelection` config. Slots that share this key share one
 * interaction manager; different colors/max/hover become separate groups.
 */
export function selectionSlotGroupKey(
	eventProps: IAppBuilderActionSlotEventPropsSelection | undefined,
	viewportId: string,
): string {
	return JSON.stringify({
		viewportId: eventProps?.viewportId ?? viewportId,
		nameFilter: normalizedNameFilter(eventProps),
		minimumSelection: eventProps?.minimumSelection ?? 0,
		maximumSelection: eventProps?.maximumSelection ?? 1,
		hover: eventProps?.hover !== false,
		hoverColor: eventProps?.hoverColor ?? null,
		selectionColor: eventProps?.selectionColor ?? null,
		availableColor: eventProps?.availableColor ?? null,
		occludeBySceneGeometry: eventProps?.occludeBySceneGeometry ?? null,
	});
}
