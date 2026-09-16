import {waitForAppBuilderViewport} from "@AppBuilderLib/entities/viewport/lib/waitForAppBuilderViewport";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {
	actionSlotHandlerKey,
	APP_BUILDER_SLOT_EVENTS,
	getActionSlotEventProps,
	isAppBuilderInteractionEvent,
	isSessionCustomizationFailedTask,
	logIgnoredActionSlotEvents,
	matchesExportName,
	matchesSessionFilter,
	pickAllowedActionSlots,
	readStringField,
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
	handlersRef: MutableRefObject<Record<string, (() => void) | undefined>>,
	item: ResolvedActionSlot,
): void {
	handlersRef.current[actionSlotHandlerKey(item.eventName, item.index)]?.();
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
	handlersRef: MutableRefObject<Record<string, (() => void) | undefined>>;
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

	useEffect(() => {
		const computationStart = itemsNamed(resolved, "computationstart");
		const computationEnd = itemsNamed(resolved, "computationend");
		const computationError = itemsNamed(resolved, "computationerror");
		const exportStart = itemsNamed(resolved, "exportstart");
		const exportEnd = itemsNamed(resolved, "exportend");
		const exportError = itemsNamed(resolved, "exporterror");

		const tokens: string[] = [];

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
			tokens.push(
				addListener(EVENTTYPE_TASK.TASK_CANCEL, (event) => {
					const taskEvent = event as ITaskEvent;
					if (!isSessionCustomizationFailedTask(taskEvent)) return;
					const sessionId = getTaskSessionId(taskEvent);
					for (const item of computationError) {
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
 * file does not import ShapeDiver `useSelection`. Kept out of
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
	const handlersRef = useRef<Record<string, (() => void) | undefined>>({});
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
			{resolved.map(({eventName, slot, index}) => (
				<AppBuilderActionSlotRunner
					key={actionSlotHandlerKey(eventName, index)}
					definition={slot.action}
					namespace={namespace}
					viewportId={viewportId}
					fullscreenId={fullscreenId}
					eventName={eventName}
					registerTrigger={(trigger) => {
						handlersRef.current[
							actionSlotHandlerKey(eventName, index)
						] = () => {
							void trigger();
						};
					}}
				/>
			))}
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
