import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {waitForAppBuilderViewport} from "@AppBuilderLib/entities/viewport/lib/waitForAppBuilderViewport";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {
	actionSlotHandlerKey,
	APP_BUILDER_PARAMETER_COMPUTATION_EVENTS,
	APP_BUILDER_SLOT_EVENTS,
	createParameterComputationTaskFilter,
	getActionSlotEventProps,
	isAppBuilderInteractionEvent,
	isSessionCustomizationFailedTask,
	logIgnoredActionSlotEvents,
	matchesExportName,
	matchesSessionFilter,
	pickAllowedActionSlots,
	readStringField,
	type ComputationTaskFilter,
	type ResolvedActionSlot,
} from "@AppBuilderLib/features/appbuilder/lib/appBuilderActionSlots";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {
	addListener,
	EVENTTYPE_TASK,
	removeListener,
	TASK_TYPE,
	type ITaskEvent,
} from "@shapediver/viewer.session";
import {MutableRefObject, useContext, useEffect, useMemo, useRef} from "react";
import type {
	IAppBuilderActionSlot,
	IAppBuilderActionSlots,
	IAppBuilderParameterControlActionSlots,
} from "../config/appbuilderActionSlots";
import {AppBuilderActionSlotRunner} from "./AppBuilderActionSlotRunner";

const SESSION_ID_KEYS = ["sessionId", "session"] as const;

/** Session id on a viewer task payload (`data.sessionId` / nested `{ id }`). */
function getTaskSessionId(event: ITaskEvent): string | undefined {
	return readStringField(event.data, SESSION_ID_KEYS);
}

/** Export identity on `EXPORT_REQUEST` (`data.exportId` / `name` / `displayname`). */
function getTaskExportIdentity(event: ITaskEvent): {
	id?: string;
	name?: string;
	displayname?: string;
} {
	return {
		id: readStringField(event.data, ["exportId", "id"]),
		name: readStringField(event.data, ["name"]),
		displayname: readStringField(event.data, ["displayname"]),
	};
}

/** `computation*` slots: optional `eventProps.type: "session"`. */
function shouldRunComputationSlot(
	slot: IAppBuilderActionSlot,
	sessionId: string | undefined,
	controllerSessionId: string,
): boolean {
	const eventProps = getActionSlotEventProps(slot, "session") as
		{sessionId?: string} | undefined;
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
		{sessionId?: string; name?: string} | undefined;
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

/** TASK_START / TASK_END / TASK_CANCEL for `EXPORT_REQUEST`. */
function listenExportRequest(
	eventType: string,
	items: ResolvedActionSlot[],
	run: (item: ResolvedActionSlot) => void,
	namespace: string,
): string | undefined {
	if (items.length === 0) return undefined;
	return addListener(eventType, (event) => {
		const taskEvent = event as ITaskEvent;
		if (taskEvent.type !== TASK_TYPE.EXPORT_REQUEST) return;
		const sessionId = getTaskSessionId(taskEvent);
		const identity = getTaskExportIdentity(taskEvent);
		for (const item of items) {
			if (
				shouldRunExportSlot(item.slot, sessionId, identity, namespace)
			) {
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
	handlersRef: MutableRefObject<
		Record<string, (() => void | Promise<void>) | undefined>
	>,
	item: ResolvedActionSlot,
): void {
	handlersRef.current[actionSlotHandlerKey(item.eventName, item.index)]?.();
}

const COMPUTATION_LISTENERS = [
	[EVENTTYPE_TASK.TASK_START, "computationstart", "start"],
	[EVENTTYPE_TASK.TASK_END, "computationend", "end"],
	[EVENTTYPE_TASK.TASK_CANCEL, "computationerror", "cancel"],
] as const;

/**
 * Runs `computationstart`/`end`/`error` on TASK_START/END/CANCEL of
 * SESSION_CUSTOMIZATION. Used by the root and by parameter controls.
 *
 * - Without `taskFilter` (root): a slot runs for the session of its
 *   `eventProps` (default `namespace`). `computationerror` needs status
 *   "Session customization failed" (superseded customizes cancel with a
 *   different status).
 * - With `taskFilter` (parameter control): the filter decides. It sees every
 *   task event while the node has any computation slot, so it can track the
 *   tasks it started.
 */
export function useComputationSlotListeners(
	resolved: ResolvedActionSlot[],
	handlersRef: MutableRefObject<
		Record<string, (() => void | Promise<void>) | undefined>
	>,
	namespace: string,
	taskFilter?: ComputationTaskFilter,
): void {
	useEffect(() => {
		const hasAny = COMPUTATION_LISTENERS.some(
			([, eventName]) => itemsNamed(resolved, eventName).length > 0,
		);
		const tokens: string[] = [];
		for (const [eventType, eventName, filterKey] of COMPUTATION_LISTENERS) {
			const items = itemsNamed(resolved, eventName);
			if (taskFilter ? !hasAny : items.length === 0) continue;
			tokens.push(
				addListener(eventType, (event) => {
					const taskEvent = event as ITaskEvent;
					if (taskEvent.type !== TASK_TYPE.SESSION_CUSTOMIZATION)
						return;
					if (taskFilter) {
						if (!taskFilter[filterKey](taskEvent)) return;
						for (const item of items) runSlot(handlersRef, item);
						return;
					}
					if (
						eventName === "computationerror" &&
						!isSessionCustomizationFailedTask(taskEvent)
					) {
						return;
					}
					const sessionId = getTaskSessionId(taskEvent);
					for (const item of items) {
						if (
							shouldRunComputationSlot(
								item.slot,
								sessionId,
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
		};
	}, [handlersRef, namespace, resolved, taskFilter]);
}

/** One runner per resolved slot; its trigger is written into `handlersRef`. */
function ActionSlotRunners({
	resolved,
	handlersRef,
	namespace,
	viewportId,
	fullscreenId,
	registerCustomGlobally,
}: {
	resolved: ResolvedActionSlot[];
	handlersRef: MutableRefObject<
		Record<string, (() => void | Promise<void>) | undefined>
	>;
	namespace: string;
	viewportId: string;
	fullscreenId?: string;
	registerCustomGlobally?: boolean;
}) {
	return (
		<>
			{resolved.map(({eventName, slot, index}) => (
				<AppBuilderActionSlotRunner
					key={actionSlotHandlerKey(eventName, index)}
					definition={slot.action}
					namespace={namespace}
					viewportId={viewportId}
					fullscreenId={fullscreenId}
					eventName={eventName}
					registerCustomGlobally={registerCustomGlobally}
					registerTrigger={(trigger) => {
						handlersRef.current[
							actionSlotHandlerKey(eventName, index)
						] = () => trigger();
					}}
				/>
			))}
		</>
	);
}

/**
 * Registers application-event listeners. Callers must already have filtered
 * `resolved` with {@link pickAllowedActionSlots}.
 *
 * - `appready`: `waitForAppBuilderViewport` (no timeout)
 * - `computationstart`/`end`: TASK_START/END + SESSION_CUSTOMIZATION
 * - `computationerror`: TASK_CANCEL + status "Session customization failed"
 *   (local session id is on the task payload; superseded customizes cancel
 *   with a different status)
 * - `export*`: TASK_START/END/CANCEL + EXPORT_REQUEST (`data.sessionId`,
 *   `exportId`, `name`, `displayname`)
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
	handlersRef: MutableRefObject<
		Record<string, (() => void | Promise<void>) | undefined>
	>;
}) {
	const appreadyFiredForNamespace = useRef<string | undefined>(undefined);

	useEffect(() => {
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

	useComputationSlotListeners(resolved, handlersRef, namespace);

	useEffect(() => {
		const exportStart = itemsNamed(resolved, "exportstart");
		const exportEnd = itemsNamed(resolved, "exportend");
		const exportError = itemsNamed(resolved, "exporterror");

		const tokens: string[] = [];

		const exportStartToken = listenExportRequest(
			EVENTTYPE_TASK.TASK_START,
			exportStart,
			(item) => runSlot(handlersRef, item),
			namespace,
		);
		const exportEndToken = listenExportRequest(
			EVENTTYPE_TASK.TASK_END,
			exportEnd,
			(item) => runSlot(handlersRef, item),
			namespace,
		);
		const exportErrorToken = listenExportRequest(
			EVENTTYPE_TASK.TASK_CANCEL,
			exportError,
			(item) => runSlot(handlersRef, item),
			namespace,
		);
		if (exportStartToken) tokens.push(exportStartToken);
		if (exportEndToken) tokens.push(exportEndToken);
		if (exportErrorToken) tokens.push(exportErrorToken);

		return () => {
			tokens.forEach((token) => removeListener(token));
		};
	}, [handlersRef, namespace, resolved, viewportId]);

	return null;
}

type Props = {
	actionSlots?: IAppBuilderActionSlots;
	namespace: string;
	viewportId?: string;
	fullscreenId?: string;
};

/**
 * Root application slots: `appready`, computation, export. Scene
 * select/hover is host-registered via `interactionSlotListeners` so this
 * file does not import ShapeDiver `useSelection`. `appready` waits via
 * `waitForAppBuilderViewport` (access functions only). Kept out of
 * {@link AppBuilderActionSlots} so toolbar/widget UI wrappers do not import
 * viewer viewport code.
 */
export default function AppBuilderApplicationActionSlots({
	actionSlots,
	namespace,
	viewportId: inputViewportId,
	fullscreenId,
}: Props) {
	const {viewportId: defaultViewportId} = useViewportId();
	const viewportId = inputViewportId ?? defaultViewportId;
	const {viewportComponent, interactionSlotListeners} =
		useContext(ComponentContext);
	const InteractionSlotListeners = interactionSlotListeners?.component;
	const handlersRef = useRef<
		Record<string, (() => void | Promise<void>) | undefined>
	>({});
	const resolved = useMemo(
		() =>
			pickAllowedActionSlots(
				actionSlots,
				APP_BUILDER_SLOT_EVENTS.application,
			),
		[actionSlots],
	);

	useEffect(() => {
		logIgnoredActionSlotEvents(
			actionSlots,
			APP_BUILDER_SLOT_EVENTS.root,
			"on the App Builder root",
		);
		if (interactionSlotListeners !== undefined) return;
		if (
			!resolved.some((item) =>
				isAppBuilderInteractionEvent(item.eventName),
			)
		) {
			return;
		}
		Logger.warn(
			"Interaction action slots (selecton, selectoff, hoveron, hoveroff) require ComponentContext.interactionSlotListeners. ShapeDiver registers AppBuilderInteractionSlotListeners; iJewel/WebGi should supply a native component or `{ }` to skip.",
		);
	}, [actionSlots, interactionSlotListeners, resolved]);

	return (
		<>
			<ActionSlotRunners
				resolved={resolved}
				handlersRef={handlersRef}
				namespace={namespace}
				viewportId={viewportId}
				fullscreenId={fullscreenId}
				registerCustomGlobally
			/>
			<ApplicationSlotListeners
				resolved={resolved}
				namespace={namespace}
				viewportId={viewportId}
				hasViewport={!!viewportComponent}
				handlersRef={handlersRef}
			/>
			{InteractionSlotListeners ? (
				<InteractionSlotListeners
					resolved={resolved}
					namespace={namespace}
					viewportId={viewportId}
					handlersRef={handlersRef}
				/>
			) : null}
		</>
	);
}

/**
 * Computation slots of a parameter control: the root listener
 * ({@link useComputationSlotListeners}), filtered to the customizations that
 * change the control's parameter ({@link createParameterComputationTaskFilter}).
 * Also warns about the control's unsupported slots; its DOM wrapper does not.
 */
export function AppBuilderParameterComputationSlots({
	actionSlots,
	namespace,
	sessionId,
	parameterId,
}: {
	actionSlots?: IAppBuilderParameterControlActionSlots;
	/** Namespace the actions run in (the widget's). */
	namespace: string;
	/** Session of the parameter. */
	sessionId: string;
	/** Parameter id as used by the session. */
	parameterId: string;
}) {
	const {viewportId} = useViewportId();
	const handlersRef = useRef<
		Record<string, (() => void | Promise<void>) | undefined>
	>({});
	const resolved = useMemo(
		() =>
			pickAllowedActionSlots(
				actionSlots,
				APP_BUILDER_PARAMETER_COMPUTATION_EVENTS,
				{includeCustomEvents: false},
			),
		[actionSlots],
	);
	const taskFilter = useMemo(
		() =>
			createParameterComputationTaskFilter(
				sessionId,
				parameterId,
				() =>
					useShapeDiverStoreSession.getState().sessions[sessionId]
						?.parameters[parameterId]?.value,
			),
		[sessionId, parameterId],
	);
	useEffect(() => taskFilter.listen(), [taskFilter]);

	useEffect(() => {
		logIgnoredActionSlotEvents(
			actionSlots,
			APP_BUILDER_SLOT_EVENTS.parameterControl,
			"on this parameter control",
		);
	}, [actionSlots]);

	useComputationSlotListeners(resolved, handlersRef, namespace, taskFilter);

	return (
		<ActionSlotRunners
			resolved={resolved}
			handlersRef={handlersRef}
			namespace={namespace}
			viewportId={viewportId}
		/>
	);
}
