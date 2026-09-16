import {addExportRequestListener} from "@AppBuilderLib/entities/export/lib/exportRequestEvents";
import {waitForAppBuilderViewport} from "@AppBuilderLib/entities/viewport/lib/waitForAppBuilderViewport";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import type {AppBuilderActionRunContext} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {runAppBuilderAction} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderAction";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {Box} from "@mantine/core";
import {
	addListener,
	EVENTTYPE_SESSION,
	EVENTTYPE_TASK,
	isViewerCustomizationError,
	removeListener,
	TASK_TYPE,
	type EventResponseMapping,
	type ITaskEvent,
} from "@shapediver/viewer.session";
import {
	CSSProperties,
	MutableRefObject,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from "react";
import type {IAppBuilderActionDefinition} from "../config/appbuilder";
import type {
	AppBuilderUiEvent,
	IAppBuilderActionSlot,
	IAppBuilderActionSlots,
} from "../config/appbuilderActionSlots";
import {
	actionSlotHandlerKey,
	APP_BUILDER_SLOT_EVENTS,
	APP_BUILDER_UI_EVENTS,
	getActionSlotEventProps,
	logIgnoredActionSlotEvents,
	matchesExportName,
	matchesSessionFilter,
	pickAllowedActionSlots,
	readStringField,
	uiSlotDomProps,
	type AppBuilderUiSlotHandlers,
	type ResolvedActionSlot,
} from "../lib/appBuilderActionSlots";
import {AppBuilderInteractionSlotListeners} from "./AppBuilderInteractionSlotListeners";

/**
 * Bind JSON `actionSlots` to `runAppBuilderAction`.
 *
 * Event *registration* lives in this file:
 * - UI: React pointer/`click` props from `uiSlotDomProps` on a wrap `Box`, or
 *   written into `handlersRef` for tab buttons (Mantine forbids wrapping `Tabs.Tab`).
 * - Application: `ApplicationSlotListeners` (viewer session/task + the
 *   export request bus) and `AppBuilderInteractionSlotListeners` (viewer
 *   `selecton` / `selectoff` / `hoveron` / `hoveroff`, same as anchor
 *   `selectionProperties`). `appready` waits via
 *   `waitForAppBuilderViewport`.
 *
 * Which slots run is decided here via `pickAllowedActionSlots`.
 * Call sites pass a list from {@link APP_BUILDER_SLOT_EVENTS} (UI kinds share
 * {@link APP_BUILDER_UI_EVENTS} today). The `application` instance logs ignored
 * names against {@link APP_BUILDER_SLOT_EVENTS}.root. Several slots for one
 * event (an array in JSON) each get their own runner and `eventProps` filter.
 *
 * Tabs also call `pickAllowedActionSlots` themselves so `controlProps` only
 * include listeners for slots that will actually run.
 */

export type {AppBuilderUiSlotHandlers};

const SESSION_ID_KEYS = ["sessionId", "session"] as const;

const LAYOUT_STYLE: Record<"contents" | "block" | "fill", CSSProperties> = {
	contents: {display: "contents"},
	block: {width: "100%"},
	fill: {width: "100%", height: "100%", minHeight: 0, display: "grid"},
};

/** Session id on a viewer task payload (`data.sessionId` / nested `{ id }`). */
function getTaskSessionId(event: ITaskEvent): string | undefined {
	return readStringField(event.data, SESSION_ID_KEYS);
}

/** `computation*` slots: optional `eventProps.type: "session"`. */
function shouldRunComputationSlot(
	slot: IAppBuilderActionSlot,
	sessionId: string | undefined,
	controllerSessionId: string,
): boolean {
	const eventProps = getActionSlotEventProps(slot, "session") as
		| {sessionId?: string}
		| undefined;
	return matchesSessionFilter(
		sessionId,
		eventProps?.sessionId,
		controllerSessionId,
	);
}

/** `export*` slots: optional `eventProps.type: "export"` (session + name). */
function shouldRunExportSlot(
	slot: IAppBuilderActionSlot,
	sessionId: string | undefined,
	exportIdentity: {id?: string; name?: string; displayname?: string},
	controllerSessionId: string,
): boolean {
	const eventProps = getActionSlotEventProps(slot, "export") as
		| {sessionId?: string; name?: string}
		| undefined;
	if (
		!matchesSessionFilter(
			sessionId,
			eventProps?.sessionId,
			controllerSessionId,
		)
	) {
		return false;
	}
	return matchesExportName(exportIdentity, eventProps?.name);
}

/** TASK_START / TASK_END for `SESSION_CUSTOMIZATION` only. */
function listenSessionCustomization(
	eventType: string,
	items: ResolvedActionSlot[],
	run: (item: ResolvedActionSlot) => void,
	namespace: string,
): string | undefined {
	if (items.length === 0) return undefined;
	return addListener(eventType, (event) => {
		const taskEvent = event as ITaskEvent;
		if (taskEvent.type !== TASK_TYPE.SESSION_CUSTOMIZATION) return;
		const sessionId = getTaskSessionId(taskEvent);
		for (const item of items) {
			if (shouldRunComputationSlot(item.slot, sessionId, namespace)) {
				run(item);
			}
		}
	});
}

function itemsNamed(
	resolved: ResolvedActionSlot[],
	eventName: string,
): ResolvedActionSlot[] {
	return resolved.filter((item) => item.eventName === eventName);
}

function runSlot(
	handlersRef: MutableRefObject<Record<string, (() => void) | undefined>>,
	item: ResolvedActionSlot,
): void {
	handlersRef.current[actionSlotHandlerKey(item.eventName, item.index)]?.();
}

/**
 * One runner per allowed slot. Hooks cannot run in a dynamic loop, so this
 * is a component. It writes a trigger into `registerTrigger` (UI ref or
 * application ref); it does not attach listeners itself.
 */
function ActionSlotRunner({
	definition,
	namespace,
	viewportId,
	fullscreenId,
	registerTrigger,
}: {
	definition: IAppBuilderActionDefinition;
	namespace: string;
	viewportId?: string;
	fullscreenId?: string;
	registerTrigger: (trigger: () => void | Promise<void>) => void;
}) {
	const {actions: hostActions} = useContext(ComponentContext);
	const {viewportId: defaultViewportId} = useViewportId();
	const resolvedViewportId = viewportId ?? defaultViewportId;

	const contextRef = useRef<AppBuilderActionRunContext>({
		namespace,
		viewportId: resolvedViewportId,
		fullscreenId,
		hostActions,
	});
	contextRef.current = {
		namespace,
		viewportId: resolvedViewportId,
		fullscreenId,
		hostActions,
	};

	const definitionRef = useRef(definition);
	definitionRef.current = definition;

	registerTrigger(() =>
		runAppBuilderAction(definitionRef.current, contextRef.current).catch(
			(error) => {
				Logger.warn("Action slot failed:", error);
			},
		),
	);

	return null;
}

/**
 * Registers application-event listeners. Callers must already have filtered
 * `resolved` with {@link pickAllowedActionSlots}.
 *
 * - `appready`: `waitForAppBuilderViewport` (no timeout)
 * - `computationstart`/`end`: TASK_START/END + SESSION_CUSTOMIZATION
 * - `computationerror`: SESSION_ERROR + `isViewerCustomizationError`
 *   (not TASK_CANCEL — superseded customizes cancel without failing)
 * - `export*`: store-backed export request bus (viewer EXPORT_REQUEST has no identity)
 */
function ApplicationSlotListeners({
	resolved,
	namespace,
	viewportId,
	hasViewport,
	handlersRef,
}: {
	resolved: ResolvedActionSlot[];
	namespace: string;
	viewportId: string;
	hasViewport: boolean;
	handlersRef: MutableRefObject<Record<string, (() => void) | undefined>>;
}) {
	const appreadyFiredForNamespace = useRef<string | undefined>(undefined);

	useEffect(() => {
		// `appready` is not a viewer event: wait until the viewport is visible
		// (host `waitUntilReady`, or ShapeDiver scene bbox), then fire once.
		const appreadyItems = itemsNamed(resolved, "appready");
		if (appreadyItems.length === 0) return;
		if (appreadyFiredForNamespace.current === namespace) return;
		const abort = new AbortController();
		void (async () => {
			await waitForAppBuilderViewport(viewportId, {
				signal: abort.signal,
				waitForScene: hasViewport,
			});
			if (abort.signal.aborted) return;
			if (appreadyFiredForNamespace.current === namespace) return;
			appreadyFiredForNamespace.current = namespace;
			for (const item of appreadyItems) runSlot(handlersRef, item);
		})();
		return () => {
			abort.abort();
		};
	}, [handlersRef, hasViewport, namespace, resolved, viewportId]);

	useEffect(() => {
		const computationStart = itemsNamed(resolved, "computationstart");
		const computationEnd = itemsNamed(resolved, "computationend");
		const computationError = itemsNamed(resolved, "computationerror");
		const exportStart = itemsNamed(resolved, "exportstart");
		const exportEnd = itemsNamed(resolved, "exportend");
		const exportError = itemsNamed(resolved, "exporterror");

		const tokens: string[] = [];
		const cleanups: Array<() => void> = [];

		// computationstart / computationend
		const startToken = listenSessionCustomization(
			EVENTTYPE_TASK.TASK_START,
			computationStart,
			(item) => runSlot(handlersRef, item),
			namespace,
		);
		const endToken = listenSessionCustomization(
			EVENTTYPE_TASK.TASK_END,
			computationEnd,
			(item) => runSlot(handlersRef, item),
			namespace,
		);
		if (startToken) tokens.push(startToken);
		if (endToken) tokens.push(endToken);

		if (computationError.length > 0) {
			// computationerror: SESSION_ERROR while customizing, not TASK_CANCEL
			tokens.push(
				addListener(EVENTTYPE_SESSION.SESSION_ERROR, (event) => {
					const sessionEvent =
						event as EventResponseMapping[typeof EVENTTYPE_SESSION.SESSION_ERROR];
					if (!isViewerCustomizationError(sessionEvent.error)) return;
					for (const item of computationError) {
						if (
							shouldRunComputationSlot(
								item.slot,
								sessionEvent.sessionId,
								namespace,
							)
						) {
							runSlot(handlersRef, item);
						}
					}
				}),
			);
		}

		if (
			exportStart.length > 0 ||
			exportEnd.length > 0 ||
			exportError.length > 0
		) {
			// exportstart / exportend / exporterror
			cleanups.push(
				addExportRequestListener((event) => {
					const identity = {
						id: event.id,
						name: event.name,
						displayname: event.displayname,
					};
					const items =
						event.phase === "start"
							? exportStart
							: event.phase === "end"
								? exportEnd
								: exportError;
					for (const item of items) {
						if (
							shouldRunExportSlot(
								item.slot,
								event.sessionId,
								identity,
								namespace,
							)
						) {
							runSlot(handlersRef, item);
						}
					}
				}),
			);
		}

		return () => {
			tokens.forEach((token) => removeListener(token));
			cleanups.forEach((cleanup) => cleanup());
		};
	}, [handlersRef, namespace, resolved, viewportId]);

	return null;
}

type Props = {
	actionSlots?: IAppBuilderActionSlots;
	namespace: string;
	/**
	 * Override the default allowlist. Callers pass {@link APP_BUILDER_SLOT_EVENTS}
	 * for the node kind. Defaults: UI events, or application events when
	 * `application` is set.
	 */
	allowedEvents?: readonly string[];
	viewportId?: string;
	fullscreenId?: string;
	/**
	 * Wrapper layout. `contents` keeps the node's layout (default) — no visual
	 * change. `block` is used when pointer enter/leave need a hit box.
	 * `fill` is for the viewport host so pointer enter/leave have a box.
	 */
	layout?: "contents" | "block" | "fill";
	/**
	 * Listen for application events (`appready`, computation, export,
	 * viewer interaction) instead of attaching DOM handlers.
	 */
	application?: boolean;
	/** Skip unsupported-slot warnings (viewport wrap; the application instance already warns). */
	warnUnsupported?: boolean;
	/** When set, write UI triggers here instead of an internal ref (tab controls). */
	handlersRef?: MutableRefObject<AppBuilderUiSlotHandlers>;
	children?: ReactNode;
};

/**
 * Binds `actionSlots` to `runAppBuilderAction`.
 *
 * - Default: wrap `children` with pointer/`click` handlers. `display: contents`
 *   does not change layout; hover slots promote to `block` so enter/leave fire.
 * - `application`: no wrapper; listen to session/export events and activate
 *   viewer interaction slots like anchor `selectionProperties`.
 * - `handlersRef`: bind UI triggers without wrapping (Mantine tab buttons).
 */
export default function AppBuilderActionSlots({
	actionSlots,
	namespace,
	allowedEvents,
	viewportId: inputViewportId,
	fullscreenId,
	layout = "contents",
	application = false,
	warnUnsupported = true,
	handlersRef: externalHandlersRef,
	children,
}: Props) {
	const {viewportId: defaultViewportId} = useViewportId();
	const viewportId = inputViewportId ?? defaultViewportId;
	const {viewportComponent} = useContext(ComponentContext);
	// Per-instance allowlist from APP_BUILDER_SLOT_EVENTS, unless omitted.
	const resolvedAllowedEvents =
		allowedEvents ??
		(application
			? APP_BUILDER_SLOT_EVENTS.application
			: APP_BUILDER_UI_EVENTS);
	const internalHandlersRef = useRef<AppBuilderUiSlotHandlers>({});
	const handlersRef = externalHandlersRef ?? internalHandlersRef;
	const applicationHandlersRef = useRef<
		Record<string, (() => void) | undefined>
	>({});

	// Slots this instance will run. Names outside the allowlist are dropped
	// here and optionally logged below (custom:* is debug, others warn).
	const resolved = useMemo(
		() => pickAllowedActionSlots(actionSlots, resolvedAllowedEvents),
		[actionSlots, resolvedAllowedEvents],
	);
	const eventNames = useMemo(
		() => new Set(resolved.map((item) => item.eventName)),
		[resolved],
	);
	const resolvedLayout =
		layout === "contents" &&
		(eventNames.has("pointerenter") || eventNames.has("pointerleave"))
			? "block"
			: layout;

	const run = useCallback(
		(eventName: AppBuilderUiEvent) => {
			const map = handlersRef.current as Record<
				string,
				(() => void) | undefined
			>;
			for (const item of resolved) {
				if (item.eventName !== eventName) continue;
				map[actionSlotHandlerKey(item.eventName, item.index)]?.();
			}
		},
		[handlersRef, resolved],
	);

	useEffect(() => {
		if (!warnUnsupported) return;
		logIgnoredActionSlotEvents(
			actionSlots,
			application ? APP_BUILDER_SLOT_EVENTS.root : resolvedAllowedEvents,
			application ? "on the App Builder root" : "on this node",
		);
	}, [actionSlots, application, resolvedAllowedEvents, warnUnsupported]);

	const runners = (
		<>
			{resolved.map(({eventName, slot, index}) => (
				<ActionSlotRunner
					key={actionSlotHandlerKey(eventName, index)}
					definition={slot.action}
					namespace={namespace}
					viewportId={viewportId}
					fullscreenId={fullscreenId}
					registerTrigger={(trigger) => {
						const map = application
							? applicationHandlersRef
							: handlersRef;
						const key = actionSlotHandlerKey(eventName, index);
						(
							map.current as Record<
								string,
								(() => void) | undefined
							>
						)[key] = () => {
							void trigger();
						};
						if (!application) {
							(
								map.current as Record<
									string,
									(() => void) | undefined
								>
							)[eventName] = () => {
								for (const item of resolved) {
									if (item.eventName !== eventName) continue;
									(
										map.current as Record<
											string,
											(() => void) | undefined
										>
									)[
										actionSlotHandlerKey(
											item.eventName,
											item.index,
										)
									]?.();
								}
							};
						}
					}}
				/>
			))}
		</>
	);

	if (application) {
		// No DOM wrap: ApplicationSlotListeners registers viewer/store events.
		return (
			<>
				{runners}
				<ApplicationSlotListeners
					resolved={resolved}
					namespace={namespace}
					viewportId={viewportId}
					hasViewport={!!viewportComponent}
					handlersRef={applicationHandlersRef}
				/>
				<AppBuilderInteractionSlotListeners
					resolved={resolved}
					viewportId={viewportId}
					handlersRef={applicationHandlersRef}
				/>
			</>
		);
	}

	if (externalHandlersRef || resolved.length === 0) {
		// Tab buttons: runners write into handlersRef; DOM props are on Tabs.Tab.
		// No allowed slots: still render children (ignored names already logged).
		return (
			<>
				{runners}
				{children}
			</>
		);
	}

	return (
		<>
			{runners}
			{/* UI registration: React pointer/`click` props on the wrap Box. */}
			<Box
				style={LAYOUT_STYLE[resolvedLayout]}
				{...uiSlotDomProps(run, eventNames)}
			>
				{children}
			</Box>
		</>
	);
}
