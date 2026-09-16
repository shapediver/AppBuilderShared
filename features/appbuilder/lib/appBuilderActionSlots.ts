import {Logger} from "@AppBuilderLib/shared/lib/logger";
import type {
	AppBuilderApplicationEvent,
	AppBuilderUiEvent,
	IAppBuilderActionSlot,
	IAppBuilderActionSlotEventProps,
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

/** Application events valid on the root `IAppBuilder` only. */
export const APP_BUILDER_APPLICATION_EVENTS: readonly AppBuilderApplicationEvent[] =
	[
		"appready",
		"computationstart",
		"computationend",
		"computationerror",
		"exportstart",
		"exportend",
		"exporterror",
		"selectionchange",
	];

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
 * Returns `undefined` when omitted or when the JSON type does not match
 * (wrong filter on this event is treated as “no filter”).
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
};

/**
 * Slots whose event names are in `allowedEvents`.
 * Custom events and names outside the allowlist are omitted (see {@link logIgnoredActionSlotEvents}).
 */
export function pickAllowedActionSlots(
	actionSlots: IAppBuilderActionSlots | undefined,
	allowedEvents: readonly string[],
): ResolvedActionSlot[] {
	if (!actionSlots) return [];
	const allowed = new Set(allowedEvents);
	const resolved: ResolvedActionSlot[] = [];
	for (const eventName of Object.keys(actionSlots)) {
		if (!allowed.has(eventName)) continue;
		const slot = (
			actionSlots as Record<string, IAppBuilderActionSlot | undefined>
		)[eventName];
		if (!slot) continue;
		resolved.push({eventName, slot});
	}
	return resolved;
}

/**
 * Warn for slots that this node will not run.
 * `custom:*` is debug-only (parsed, not emitted yet). Other unknown names are warnings.
 */
export function logIgnoredActionSlotEvents(
	actionSlots: IAppBuilderActionSlots | undefined,
	allowedEvents: readonly string[],
	unsupportedOn: string,
): void {
	if (!actionSlots) return;
	const allowed = new Set(allowedEvents);
	for (const eventName of Object.keys(actionSlots)) {
		const slot = (
			actionSlots as Record<string, IAppBuilderActionSlot | undefined>
		)[eventName];
		if (!slot || allowed.has(eventName)) continue;
		if (eventName.startsWith("custom:")) {
			Logger.debug(
				`Custom action slot "${eventName}" is not emitted ${unsupportedOn}.`,
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
