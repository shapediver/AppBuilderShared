import {addExportRequestListener} from "@AppBuilderLib/entities/export/lib/exportRequestEvents";
import {getPatterns} from "@AppBuilderLib/entities/parameter/model/interaction/useCreateNameFilterPattern";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {waitForAppBuilderViewport} from "@AppBuilderLib/entities/viewport/lib/waitForAppBuilderViewport";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import type {AppBuilderActionRunContext} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {runAppBuilderAction} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderAction";
import {useShapeDiverStoreInstances} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreInstances";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {Box} from "@mantine/core";
import {
	matchNodesWithPatterns,
	type IMultiSelectEvent,
	type ISelectEvent,
	type OutputNodeNameFilterPatterns,
} from "@shapediver/viewer.features.interaction";
import {
	addListener,
	EVENTTYPE_INTERACTION,
	EVENTTYPE_SESSION,
	EVENTTYPE_TASK,
	isViewerCustomizationError,
	removeListener,
	TASK_TYPE,
	type EventResponseMapping,
	type ITaskEvent,
	type ITreeNode,
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
} from "../lib/appBuilderActionSlots";

/**
 * Bind JSON `actionSlots` to `runAppBuilderAction`.
 *
 * Event *registration* lives in this file:
 * - UI: React pointer/`click` props from `uiSlotDomProps` on a wrap `Box`, or
 *   written into `handlersRef` for tab buttons (Mantine forbids wrapping `Tabs.Tab`).
 * - Application: `ApplicationSlotListeners` (viewer session/task/selection +
 *   the export request bus). `appready` waits via `waitForAppBuilderViewport`.
 *
 * Which slots run is decided here via `pickAllowedActionSlots`.
 * Call sites pass a list from {@link APP_BUILDER_SLOT_EVENTS} (UI kinds share
 * {@link APP_BUILDER_UI_EVENTS} today). The `application` instance logs ignored
 * names against {@link APP_BUILDER_SLOT_EVENTS}.root.
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

function getNodesFromSelectEvent(
	event: ISelectEvent | IMultiSelectEvent,
): ITreeNode[] {
	const multi = event as IMultiSelectEvent;
	if (Array.isArray(multi.nodes) && multi.nodes.length > 0)
		return multi.nodes;
	if (event.node) return [event.node];
	if (Array.isArray(event.groupedNodes) && event.groupedNodes.length > 0)
		return event.groupedNodes;
	return [];
}

/**
 * Same `nameFilter` conversion as selection parameters: `getPatterns` +
 * viewer `matchNodesWithPatterns` (output display names and hierarchy).
 */
function selectionMatchesNameFilter(
	nodes: ITreeNode[],
	nameFilter?: string[],
): boolean {
	if (!nameFilter || nameFilter.length === 0) return true;
	const sessions = useShapeDiverStoreSession.getState().sessions;
	const instances = useShapeDiverStoreInstances.getState().instances;
	const {outputPatterns, instancePatterns} = getPatterns(
		sessions,
		instances,
		nameFilter,
	);
	const patterns: OutputNodeNameFilterPatterns = {
		...(instancePatterns ?? {}),
	};
	if (outputPatterns) {
		for (const byOutput of Object.values(outputPatterns)) {
			Object.assign(patterns, byOutput);
		}
	}
	return matchNodesWithPatterns(patterns, nodes).length > 0;
}

/** `selectionchange`: optional viewport id and `nameFilter`. */
function shouldRunSelectionSlot(
	slot: IAppBuilderActionSlot,
	viewportId: string | undefined,
	nodes: ITreeNode[],
	defaultViewportId: string,
): boolean {
	const eventProps = getActionSlotEventProps(slot, "selection") as
		| {nameFilter?: string[]; viewportId?: string}
		| undefined;
	const expectedViewport = eventProps?.viewportId ?? defaultViewportId;
	if (viewportId && viewportId !== expectedViewport) return false;
	return selectionMatchesNameFilter(nodes, eventProps?.nameFilter);
}

/** TASK_START / TASK_END for `SESSION_CUSTOMIZATION` only. */
function listenSessionCustomization(
	eventType: string,
	slot: IAppBuilderActionSlot | undefined,
	run: () => void,
	namespace: string,
): string | undefined {
	if (!slot) return undefined;
	return addListener(eventType, (event) => {
		const taskEvent = event as ITaskEvent;
		if (taskEvent.type !== TASK_TYPE.SESSION_CUSTOMIZATION) return;
		if (
			shouldRunComputationSlot(
				slot,
				getTaskSessionId(taskEvent),
				namespace,
			)
		) {
			run();
		}
	});
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
 * `slotsByName` with {@link pickAllowedActionSlots}.
 *
 * - `appready`: `waitForAppBuilderViewport` (no timeout)
 * - `computationstart`/`end`: TASK_START/END + SESSION_CUSTOMIZATION
 * - `computationerror`: SESSION_ERROR + `isViewerCustomizationError`
 *   (not TASK_CANCEL — superseded customizes cancel without failing)
 * - `export*`: store-backed export request bus (viewer EXPORT_REQUEST has no identity)
 * - `selectionchange`: SELECT_ON/OFF and MULTI_SELECT_ON/OFF
 */
function ApplicationSlotListeners({
	slotsByName,
	namespace,
	viewportId,
	hasViewport,
	handlersRef,
}: {
	slotsByName: Record<string, IAppBuilderActionSlot>;
	namespace: string;
	viewportId: string;
	hasViewport: boolean;
	handlersRef: MutableRefObject<Record<string, (() => void) | undefined>>;
}) {
	const appreadyFiredForNamespace = useRef<string | undefined>(undefined);

	useEffect(() => {
		// `appready` is not a viewer event: wait until the viewport is visible
		// (host `waitUntilReady`, or ShapeDiver scene bbox), then fire once.
		if (!slotsByName.appready) return;
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
			handlersRef.current.appready?.();
		})();
		return () => {
			abort.abort();
		};
	}, [handlersRef, hasViewport, namespace, slotsByName.appready, viewportId]);

	useEffect(() => {
		const computationStart = slotsByName.computationstart;
		const computationEnd = slotsByName.computationend;
		const computationError = slotsByName.computationerror;
		const exportStart = slotsByName.exportstart;
		const exportEnd = slotsByName.exportend;
		const exportError = slotsByName.exporterror;
		const selectionChange = slotsByName.selectionchange;

		const tokens: string[] = [];
		const cleanups: Array<() => void> = [];

		// computationstart / computationend
		const startToken = listenSessionCustomization(
			EVENTTYPE_TASK.TASK_START,
			computationStart,
			() => handlersRef.current.computationstart?.(),
			namespace,
		);
		const endToken = listenSessionCustomization(
			EVENTTYPE_TASK.TASK_END,
			computationEnd,
			() => handlersRef.current.computationend?.(),
			namespace,
		);
		if (startToken) tokens.push(startToken);
		if (endToken) tokens.push(endToken);

		if (computationError) {
			// computationerror: SESSION_ERROR while customizing, not TASK_CANCEL
			tokens.push(
				addListener(EVENTTYPE_SESSION.SESSION_ERROR, (event) => {
					const sessionEvent =
						event as EventResponseMapping[typeof EVENTTYPE_SESSION.SESSION_ERROR];
					if (!isViewerCustomizationError(sessionEvent.error)) return;
					if (
						shouldRunComputationSlot(
							computationError,
							sessionEvent.sessionId,
							namespace,
						)
					) {
						handlersRef.current.computationerror?.();
					}
				}),
			);
		}

		if (exportStart || exportEnd || exportError) {
			// exportstart / exportend / exporterror
			cleanups.push(
				addExportRequestListener((event) => {
					const identity = {
						id: event.id,
						name: event.name,
						displayname: event.displayname,
					};
					const slot =
						event.phase === "start"
							? exportStart
							: event.phase === "end"
								? exportEnd
								: exportError;
					const handler =
						event.phase === "start"
							? handlersRef.current.exportstart
							: event.phase === "end"
								? handlersRef.current.exportend
								: handlersRef.current.exporterror;
					if (
						slot &&
						handler &&
						shouldRunExportSlot(
							slot,
							event.sessionId,
							identity,
							namespace,
						)
					) {
						handler();
					}
				}),
			);
		}

		if (selectionChange) {
			// selectionchange
			const onSelection = (event: ISelectEvent | IMultiSelectEvent) => {
				const nodes = getNodesFromSelectEvent(event);
				if (
					shouldRunSelectionSlot(
						selectionChange,
						event.viewportId,
						nodes,
						viewportId,
					)
				) {
					handlersRef.current.selectionchange?.();
				}
			};
			tokens.push(
				addListener(EVENTTYPE_INTERACTION.SELECT_ON, (event) =>
					onSelection(event as ISelectEvent),
				),
			);
			tokens.push(
				addListener(EVENTTYPE_INTERACTION.SELECT_OFF, (event) => {
					const selectEvent = event as ISelectEvent;
					if (selectEvent.reselection) return;
					onSelection(selectEvent);
				}),
			);
			tokens.push(
				addListener(EVENTTYPE_INTERACTION.MULTI_SELECT_ON, (event) =>
					onSelection(event as IMultiSelectEvent),
				),
			);
			tokens.push(
				addListener(EVENTTYPE_INTERACTION.MULTI_SELECT_OFF, (event) =>
					onSelection(event as IMultiSelectEvent),
				),
			);
		}

		return () => {
			tokens.forEach((token) => removeListener(token));
			cleanups.forEach((cleanup) => cleanup());
		};
	}, [handlersRef, namespace, slotsByName, viewportId]);

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
	 * `selectionchange`) instead of attaching DOM handlers.
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
 * - `application`: no wrapper; listen to session/export/selection events.
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
	const slotsByName = useMemo(() => {
		const map: Record<string, IAppBuilderActionSlot> = {};
		for (const item of resolved) map[item.eventName] = item.slot;
		return map;
	}, [resolved]);
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
			handlersRef.current[eventName]?.();
		},
		[handlersRef],
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
			{resolved.map(({eventName, slot}) => (
				<ActionSlotRunner
					key={eventName}
					definition={slot.action}
					namespace={namespace}
					viewportId={viewportId}
					fullscreenId={fullscreenId}
					registerTrigger={(trigger) => {
						const map = application
							? applicationHandlersRef
							: handlersRef;
						(
							map.current as Record<
								string,
								(() => void) | undefined
							>
						)[eventName] = () => {
							void trigger();
						};
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
					slotsByName={slotsByName}
					namespace={namespace}
					viewportId={viewportId}
					hasViewport={!!viewportComponent}
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
